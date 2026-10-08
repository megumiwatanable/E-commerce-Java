import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🛒 Admin</h2>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">📊 Dashboard</a>
          <a routerLink="/admin/products" routerLinkActive="active" class="nav-item">📦 Products</a>
          <a routerLink="/admin/categories" routerLinkActive="active" class="nav-item">🏷️ Categories</a>
          <a routerLink="/admin/inventory" routerLinkActive="active" class="nav-item">📋 Inventory</a>
          <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item">🛒 Orders</a>
          <a routerLink="/admin/payments" routerLinkActive="active" class="nav-item">💳 Payments</a>
        </nav>
        <div class="sidebar-footer">
          <a routerLink="/" class="nav-item">← Back to Store</a>
          <button (click)="logout()" class="nav-item logout">🚪 Logout</button>
        </div>
      </aside>
      <main class="admin-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; min-height: 100vh; }
    .sidebar { width: 250px; background: #1a1a2e; color: white; position: fixed; height: 100vh; display: flex; flex-direction: column; }
    .sidebar-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-header h2 { margin: 0; font-size: 1.2rem; }
    .sidebar-nav { flex: 1; padding: 16px 0; }
    .nav-item { display: block; padding: 12px 20px; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; border: none; background: none; width: 100%; text-align: left; cursor: pointer; font-size: 0.95rem; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.1); color: white; }
    .nav-item.active { border-left: 3px solid #e94560; }
    .sidebar-footer { padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.1); }
    .logout { color: #e94560 !important; }
    .admin-main { flex: 1; margin-left: 250px; padding: 24px; background: #f5f5f5; }
  `]
})
export class AdminLayoutComponent {
  constructor(private authService: AuthService, private router: Router) {}
  logout(): void { this.authService.logout(); this.router.navigate(['/']); }
}
