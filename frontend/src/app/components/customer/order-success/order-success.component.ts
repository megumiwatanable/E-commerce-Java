import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success-page">
      <div class="success-card">
        <div class="check-icon">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p>Thank you for your purchase. Your order has been confirmed.</p>
        <div class="order-info">
          <p>Order Number: <strong>{{orderNumber}}</strong></p>
        </div>
        <div class="actions">
          <a routerLink="/my-orders" class="primary-btn">View My Orders</a>
          <a routerLink="/products" class="secondary-btn">Continue Shopping</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-page { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .success-card { background: white; border-radius: 12px; padding: 48px; text-align: center; max-width: 500px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .check-icon { width: 80px; height: 80px; background: #16a34a; color: white; font-size: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    h1 { color: #1a1a2e; margin-bottom: 8px; }
    p { color: #666; margin: 8px 0; }
    .order-info { margin: 24px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; }
    .actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
    .primary-btn { padding: 12px 24px; background: #e94560; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .secondary-btn { padding: 12px 24px; border: 2px solid #ddd; color: #333; border-radius: 8px; text-decoration: none; font-weight: 600; }
  `]
})
export class OrderSuccessComponent implements OnInit {
  orderNumber = '';
  constructor(private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.route.params.subscribe(p => this.orderNumber = p['orderNumber']);
  }
}
