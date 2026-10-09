import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminAuthService } from '../../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="admin-login">
      <section class="brand">
        <a routerLink="/" class="back">← Storefront</a>
        <div class="brand-copy"><span class="mark">S</span><div><b>ShopHub Control</b><small>Operations workspace</small></div></div>
        <div><h1>Run the store.<br><em>Keep customer access separate.</em></h1><p>This portal uses its own administrator identity, database and session.</p></div>
      </section>
      <section class="form-panel">
        <form (ngSubmit)="submit()">
          <span class="eyebrow">SECURE ADMIN PORTAL</span><h2>Sign in</h2><p class="hint">Use an administrator account—not a storefront account.</p>
          <div *ngIf="error" class="message">{{error}}</div>
          <label>Email<input type="email" name="email" [(ngModel)]="email" required autocomplete="username" placeholder="admin@shophub.local"></label>
          <label>Password<input type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" placeholder="Enter password"></label>
          <button [disabled]="loading">{{loading ? 'Signing in…' : 'Open dashboard'}}</button>
          <p class="demo">Demo: admin&#64;shophub.local / password</p>
        </form>
      </section>
    </main>`,
  styles: [`
    :host{display:block;min-height:100vh;background:#f5f6f8;color:#172033}.admin-login{min-height:100vh;display:grid;grid-template-columns:1.1fr .9fr}.brand{padding:48px 8vw;background:linear-gradient(145deg,#111827,#1d2945);color:#fff;display:flex;flex-direction:column;justify-content:space-between}.back{color:#aab5cc;text-decoration:none}.brand-copy{display:flex;gap:12px;align-items:center}.brand-copy small{display:block;color:#94a3b8;margin-top:3px}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#ef476f;font-weight:900}.brand h1{font-size:clamp(2.4rem,5vw,4.7rem);line-height:1.02;margin:30px 0}.brand h1 em{font-style:normal;color:#ffcc66}.brand p{max-width:520px;color:#bdc7db;font-size:1.05rem;line-height:1.7}.form-panel{display:grid;place-items:center;padding:32px}form{width:min(420px,100%);background:#fff;padding:42px;border-radius:22px;box-shadow:0 20px 60px #17203318}.eyebrow{font-size:.72rem;letter-spacing:.14em;color:#ef476f;font-weight:800}h2{font-size:2.1rem;margin:10px 0 4px}.hint{color:#697386;margin:0 0 30px;line-height:1.5}label{display:block;font-weight:700;margin:18px 0 7px}input{display:block;width:100%;box-sizing:border-box;margin-top:8px;border:1px solid #dbe0e8;border-radius:10px;padding:13px 14px;font-size:1rem}input:focus{outline:3px solid #ef476f20;border-color:#ef476f}button{width:100%;border:0;border-radius:10px;padding:14px;margin-top:24px;background:#172033;color:#fff;font-size:1rem;font-weight:800;cursor:pointer}button:disabled{opacity:.6}.message{padding:12px;border-radius:9px;background:#fff0f2;color:#bd2345;margin:18px 0}.demo{text-align:center;color:#7b8494;font-size:.82rem;margin-top:20px}@media(max-width:760px){.admin-login{grid-template-columns:1fr}.brand{min-height:260px;padding:28px}.brand h1{font-size:2.3rem}.form-panel{padding:24px}form{padding:28px}}
  `]
})
export class AdminLoginComponent {
  email = ''; password = ''; loading = false; error = '';
  constructor(private auth: AdminAuthService, private router: Router, private route: ActivatedRoute) {}
  submit(): void {
    this.loading = true; this.error = '';
    this.auth.login({email: this.email, password: this.password}).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl(this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard'); },
      error: e => { this.loading = false; this.error = e.error?.message || 'Invalid administrator credentials.'; }
    });
  }
}
