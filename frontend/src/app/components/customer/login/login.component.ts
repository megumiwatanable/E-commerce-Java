import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Welcome Back</h2>
        <p class="subtitle">Sign in to your account</p>

        <div *ngIf="error" class="error-alert">{{error}}</div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="password-input">
              <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password"
                     required placeholder="Enter your password" />
              <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                {{showPassword ? '🙈' : '👁️'}}
              </button>
            </div>
          </div>
          <button type="submit" class="auth-btn" [disabled]="loading">
            {{loading ? 'Signing in...' : 'Sign In'}}
          </button>
        </form>

        <p class="auth-link">Don't have an account? <a routerLink="/register">Register</a></p>

        <div class="demo-credentials">
          <p><strong>Demo customer:</strong></p>
          <p>Customer: customer1&#64;example.com / password</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 80vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; padding: 24px; }
    .auth-card { background: white; border-radius: 12px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    h2 { text-align: center; color: #1a1a2e; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #888; margin-bottom: 32px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 600; color: #333; }
    .form-group input { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; }
    .form-group input:focus { outline: none; border-color: #e94560; }
    .password-input { position: relative; }
    .toggle-password { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2rem; }
    .auth-btn { width: 100%; padding: 14px; background: #e94560; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    .auth-btn:hover { background: #d63851; }
    .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .auth-link { text-align: center; margin-top: 20px; color: #666; }
    .auth-link a { color: #e94560; text-decoration: none; font-weight: 600; }
    .error-alert { background: #fee; color: #e94560; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
    .demo-credentials { margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; font-size: 0.85rem; color: #666; }
    .demo-credentials p { margin: 4px 0; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';
  returnUrl = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.router.navigate([this.returnUrl]);
        } else {
          this.error = response.message || 'Login failed';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid credentials';
      }
    });
  }
}
