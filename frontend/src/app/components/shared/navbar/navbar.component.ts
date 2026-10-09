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
          <span class="logo-icon">S</span>
          <span class="logo-text">SHOPHUB<small>everyday goods</small></span>
        </a>

        <div class="search-bar">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search products..."
                 (keyup.enter)="search()" />
          <button class="search-btn" (click)="search()" aria-label="Search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg></button>
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
                <button (click)="logout()" class="logout-btn">Logout</button>
              </div>
            </div>

          </ng-container>

          <ng-container *ngIf="!authService.isLoggedIn()">
            <a routerLink="/login" class="nav-link">Login</a>
            <a routerLink="/register" class="nav-btn">Register</a>
          </ng-container>
          <a routerLink="/cart" class="cart-icon" aria-label="Shopping cart">
            <svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.5 8H6"></path><circle cx="10" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg>
            <span *ngIf="cartCount > 0" class="badge">{{cartCount}}</span>
          </a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { background: rgba(255,255,255,.96); color: #172033; padding: 0; position: sticky; top: 0; z-index: 1000; border-bottom:1px solid #e5e9ed; backdrop-filter:blur(12px); }
    .nav-container { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; padding: 11px 24px; gap: 28px; }
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #172033; font-size: 1rem; font-weight: 900; letter-spacing:.08em; }
    .logo-icon { width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#185c4a;color:#fff;font-size:1rem; }
    .logo-text{display:flex;flex-direction:column}.logo-text small{font-size:.55rem;letter-spacing:.12em;color:#8a939e;font-weight:700;margin-top:1px}
    .search-bar { flex: 1; max-width: 500px; display: flex; }
    .search-bar input { flex: 1; padding: 10px 15px; border:1px solid #dfe4e8;border-right:0; border-radius: 10px 0 0 10px; font-size: 0.9rem; background:#f7f9f9; color:#172033;outline:none }
    .search-bar input:focus{border-color:#7eaa9d}.search-bar input::placeholder { color:#929aa5; }
    .search-btn { width:44px;background:#185c4a;color:#fff;border:0;border-radius:0 10px 10px 0;cursor:pointer;display:grid;place-items:center}.search-btn svg{width:18px;fill:none;stroke:currentColor;stroke-width:2}
    .nav-links { display: flex; align-items: center; gap: 20px; }
    .nav-link { color:#4c5868;text-decoration:none;font-weight:700;padding:8px 10px;border-radius:7px;font-size:.88rem;transition:background .2s }
    .nav-link:hover { background:#edf4f1;color:#185c4a }
    .nav-btn { background:#185c4a;color:white;text-decoration:none;padding:9px 17px;border-radius:9px;font-weight:700;font-size:.86rem }
    .user-menu { background:none;border:none;color:#344052;cursor:pointer;font-size:.9rem;display:flex;align-items:center;gap:4px }
    .nav-dropdown { position: relative; }
    .dropdown-content { display: none; position: absolute; right: 0; top: 100%; background: white; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); min-width: 200px; overflow: hidden; z-index: 100; }
    .nav-dropdown:hover .dropdown-content { display: block; }
    .dropdown-content a, .dropdown-content button { display: block; width: 100%; padding: 12px 16px; color: #333; text-decoration: none; border: none; background: none; text-align: left; cursor: pointer; font-size: 0.95rem; }
    .dropdown-content a:hover, .dropdown-content button:hover { background: #f5f5f5; }
    .logout-btn { color:#a83b2e!important;font-weight:700 }
    .cart-icon { position:relative;width:40px;height:40px;display:grid;place-items:center;border:1px solid #dce3e1;border-radius:10px;color:#185c4a;text-decoration:none;background:#f6faf8 }.cart-icon svg{width:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .badge { position:absolute;top:-7px;right:-7px;background:#d2644f;color:white;font-size:.66rem;min-width:19px;height:19px;display:grid;place-items:center;padding:0 4px;border-radius:10px;font-weight:800;border:2px solid #fff }
    .notification-link { display: flex; align-items: center; gap: 8px; }
    @media(max-width:800px){.nav-container{gap:12px;padding:10px 14px}.logo-text,.nav-links>.nav-link,.nav-btn{display:none}.search-bar{max-width:none}.nav-links{gap:9px}}
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

    this.cartService.getCart().subscribe();
    if (this.authService.isLoggedIn()) {
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
    this.router.navigate(['/']);
  }
}
