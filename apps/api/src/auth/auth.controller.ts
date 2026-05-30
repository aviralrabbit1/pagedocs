import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import type { GoogleProfilePayload } from './strategies/google.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.displayName);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const record = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    return record
      ? {
          id: record.id,
          email: record.email,
          displayName: record.displayName,
          avatarUrl: record.avatarUrl,
          authProvider: record.authProvider,
          createdAt: record.createdAt.toISOString(),
        }
      : null;
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  // Triggers the Google OAuth redirect; handled by passport.
  googleAuth() {
    return;
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfilePayload;
    const result = await this.auth.validateGoogleUser(profile);
    const webOrigin = this.config.getOrThrow<string>('WEB_ORIGIN');
    const url = new URL('/auth/callback', webOrigin);
    url.searchParams.set('accessToken', result.accessToken);
    url.searchParams.set('refreshToken', result.refreshToken);
    return res.redirect(url.toString());
  }
}
