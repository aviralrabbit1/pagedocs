import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  AuthResultDto,
  AuthTokensDto,
  UserDto,
} from '@pagedocs/shared-types';
import { API_BASE_URL } from './config';

const ACCESS_KEY = 'pd_access';
const REFRESH_KEY = 'pd_refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<UserDto | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  async register(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResultDto>(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        displayName,
      }),
    );
    this.applyAuthResult(res);
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResultDto>(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      }),
    );
    this.applyAuthResult(res);
  }

  async loadCurrentUser(): Promise<void> {
    if (!this.accessToken) {
      return;
    }
    try {
      const user = await firstValueFrom(
        this.http.get<UserDto>(`${API_BASE_URL}/auth/me`),
      );
      this._user.set(user);
    } catch {
      this.logout();
    }
  }

  setTokens(tokens: AuthTokensDto): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this._user.set(null);
  }

  loginWithGoogle(): void {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  private applyAuthResult(res: AuthResultDto): void {
    this.setTokens(res);
    this._user.set(res.user);
  }
}
