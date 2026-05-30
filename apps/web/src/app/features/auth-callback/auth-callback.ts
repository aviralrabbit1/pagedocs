import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

// Receives ?accessToken=&refreshToken= from the API's Google OAuth redirect.
@Component({
  selector: 'app-auth-callback',
  template: `<p>Signing you in…</p>`,
})
export class AuthCallback implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  async ngOnInit(): Promise<void> {
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');
    if (accessToken && refreshToken) {
      this.auth.setTokens({ accessToken, refreshToken });
      await this.auth.loadCurrentUser();
      await this.router.navigate(['/']);
    } else {
      await this.router.navigate(['/login']);
    }
  }
}
