import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Create Account</h2>
        <p class="subtitle">Join ShopHub today</p>

        <div *ngIf="error" class="error-alert">{{error}}</div>
        <div *ngIf="success" class="success-alert">{{success}}</div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" [(ngModel)]="form.firstName" name="firstName" required placeholder="First name" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="form.lastName" name="lastName" required placeholder="Last name" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="form.email" name="email" required placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" [(ngModel)]="form.phone" name="phone" placeholder="Phone number (optional)" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="password-input">
              <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="form.password" name="password"
                     required placeholder="Create password" minlength="6" />
              <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                {{showPassword ? '🙈' : '👁️'}}
              </button>
            </div>
          </div>
          <button type="submit" class="auth-btn" [disabled]="loading">
            {{loading ? 'Creating Account...' : 'Create Account'}}
          </button>
        </form>

        <p class="auth-link">Already have an account? <a routerLink="/login">Sign In</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 80vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; padding: 24px; }
    .auth-card { background: white; border-radius: 12px; padding: 40px; width: 100%; max-width: 480px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    h2 { text-align: center; color: #1a1a2e; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #888; margin-bottom: 32px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 600; color: #333; }
    .form-group input { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; }
    .form-group input:focus { outline: none; border-color: #e94560; }
    .password-input { position: relative; }
    .toggle-password { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2rem; }
    .auth-btn { width: 100%; padding: 14px; background: #e94560; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .auth-btn:hover { background: #d63851; }
    .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .auth-link { text-align: center; margin-top: 20px; color: #666; }
    .auth-link a { color: #e94560; text-decoration: none; font-weight: 600; }
    .error-alert { background: #fee; color: #e94560; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
    .success-alert { background: #efe; color: #16a34a; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
  `]
})
export class RegisterComponent {
  form = { firstName: '', lastName: '', email: '', phone: '', password: '' };
  showPassword = false;
  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.authService.register(this.form).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.router.navigate(['/']);
        } else {
          this.error = response.message || 'Registration failed';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }
}
