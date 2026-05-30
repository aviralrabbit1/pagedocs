import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import type {
  AuthResultDto,
  AuthTokensDto,
  UserDto,
} from '@pagedocs/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { encryptToken } from '../common/crypto.util';
import type { GoogleProfilePayload } from './strategies/google.strategy';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthResultDto> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered.');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName ?? null,
        authProvider: 'local',
      },
    });
    return this.buildAuthResult(user);
  }

  async login(email: string, password: string): Promise<AuthResultDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    return this.buildAuthResult(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    return this.issueTokens(user.id, user.email);
  }

  async validateGoogleUser(
    profile: GoogleProfilePayload,
  ): Promise<AuthResultDto> {
    if (!profile.email) {
      throw new UnauthorizedException('Google account has no email.');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          authProvider: 'google',
        },
      });
    }

    await this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.providerAccountId,
        },
      },
      create: {
        userId: user.id,
        provider: 'google',
        providerAccountId: profile.providerAccountId,
        accessToken: encryptToken(profile.accessToken),
        refreshToken: profile.refreshToken
          ? encryptToken(profile.refreshToken)
          : null,
        scope: 'email profile',
      },
      update: {
        accessToken: encryptToken(profile.accessToken),
        ...(profile.refreshToken
          ? { refreshToken: encryptToken(profile.refreshToken) }
          : {}),
      },
    });

    return this.buildAuthResult(user);
  }

  private async buildAuthResult(user: User): Promise<AuthResultDto> {
    const tokens = await this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.toUserDto(user) };
  }

  private async issueTokens(
    sub: string,
    email: string,
  ): Promise<AuthTokensDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub, email },
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: Number(this.config.get('JWT_ACCESS_TTL') ?? 900),
        },
      ),
      this.jwt.signAsync(
        { sub, email },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: Number(this.config.get('JWT_REFRESH_TTL') ?? 2592000),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
