import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="logo">
          <span class="logo-icon">🛒</span>
          <span class="logo-text">ShopHub</span>
        </a>

        <div class="search-bar">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search products..."
                 (keyup.enter)="search()" />
          <button class="search-btn" (click)="search()">🔍</button>
        </div>

        <div class="nav-links">
          <a routerLink="/products" class="nav-link">Products</a>

          <ng-container *ngIf="authService.isLoggedIn()">
            <div class="nav-dropdown">
              <button class="nav-link user-menu">
                {{ authService.getCurrentUser()?.firstName }}
                <span class="dropdown-arrow">▾</span>
              </button>
              <div class="dropdown-content">
                <a routerLink="/profile">My Profile</a>
                <a routerLink="/my-orders">My Orders</a>
                <a routerLink="/notifications" class="notification-link">
                  Notifications
                  <span *ngIf="unreadCount > 0" class="badge">{{unreadCount}}</span>
                </a>
                <a *ngIf="authService.isAdmin()" routerLink="/admin">Admin Dashboard</a>
                <button (click)="logout()" class="logout-btn">Logout</button>
              </div>
            </div>

            <a routerLink="/cart" class="cart-icon">
              🛒
              <span *ngIf="cartCount > 0" class="badge">{{cartCount}}</span>
            </a>
          </ng-container>

          <ng-container *ngIf="!authService.isLoggedIn()">
            <a routerLink="/login" class="nav-link">Login</a>
            <a routerLink="/register" class="nav-btn">Register</a>
          </ng-container>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { background: #1a1a2e; color: white; padding: 0; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
    .nav-container { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; padding: 12px 24px; gap: 24px; }
    .logo { display: flex; align-items: center; gap: 8px; text-decoration: none; color: white; font-size: 1.5rem; font-weight: 700; }
    .logo-icon { font-size: 1.8rem; }
    .search-bar { flex: 1; max-width: 500px; display: flex; }
    .search-bar input { flex: 1; padding: 10px 16px; border: none; border-radius: 8px 0 0 8px; font-size: 0.95rem; background: rgba(255,255,255,0.1); color: white; }
    .search-bar input::placeholder { color: rgba(255,255,255,0.5); }
    .search-btn { padding: 10px 16px; background: #e94560; border: none; border-radius: 0 8px 8px 0; cursor: pointer; font-size: 1.1rem; }
    .nav-links { display: flex; align-items: center; gap: 20px; }
    .nav-link { color: rgba(255,255,255,0.9); text-decoration: none; font-weight: 500; padding: 8px 12px; border-radius: 6px; transition: background 0.2s; }
    .nav-link:hover { background: rgba(255,255,255,0.1); }
    .nav-btn { background: #e94560; color: white; text-decoration: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; }
    .user-menu { background: none; border: none; color: white; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 4px; }
    .nav-dropdown { position: relative; }
    .dropdown-content { display: none; position: absolute; right: 0; top: 100%; background: white; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); min-width: 200px; overflow: hidden; z-index: 100; }
    .nav-dropdown:hover .dropdown-content { display: block; }
    .dropdown-content a, .dropdown-content button { display: block; width: 100%; padding: 12px 16px; color: #333; text-decoration: none; border: none; background: none; text-align: left; cursor: pointer; font-size: 0.95rem; }
    .dropdown-content a:hover, .dropdown-content button:hover { background: #f5f5f5; }
    .logout-btn { color: #e94560 !important; font-weight: 600; }
    .cart-icon { position: relative; font-size: 1.4rem; text-decoration: none; }
    .badge { position: absolute; top: -8px; right: -8px; background: #e94560; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 50%; font-weight: 700; }
    .notification-link { display: flex; align-items: center; gap: 8px; }
  `]
})
export class NavbarComponent implements OnInit {
  searchQuery = '';
  cartCount = 0;
  unreadCount = 0;

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart?.totalItems || 0;
    });

    if (this.authService.isLoggedIn()) {
      this.cartService.getCart().subscribe();
      this.notificationService.getUnreadCount().subscribe();
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      });
    }
  }

  search(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }

  logout(): void {
    this.authService.logout();
    this.cartService.clearCart().subscribe();
    this.router.navigate(['/']);
  }
}
