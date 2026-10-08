import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="orders-page">
      <h1>My Orders</h1>
      <div class="filters">
        <button *ngFor="let f of filters" [class.active]="activeFilter === f.value"
                (click)="filterOrders(f.value)">{{f.label}}</button>
      </div>
      <div *ngIf="orders.length === 0" class="empty"><p>No orders found</p></div>
      <div *ngFor="let order of orders" class="order-card" [routerLink]="['/order', order.id]">
        <div class="order-header">
          <span class="order-num">{{order.orderNumber}}</span>
          <span class="date">{{order.createdAt | date:'mediumDate'}}</span>
        </div>
        <div class="order-body">
          <span class="amount">\${{order.finalAmount.toFixed(2)}}</span>
          <span class="status-badge" [class]="order.orderStatus.toLowerCase()">{{order.orderStatus}}</span>
          <span class="payment-badge" [class]="order.paymentStatus.toLowerCase()">{{order.paymentStatus}}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-page { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
    h1 { color: #1a1a2e; margin-bottom: 20px; }
    .filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .filters button { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; font-size: 0.9rem; }
    .filters button.active { background: #1a1a2e; color: white; border-color: #1a1a2e; }
    .order-card { background: white; border-radius: 10px; padding: 20px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; transition: box-shadow 0.2s; }
    .order-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .order-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .order-num { font-weight: 700; color: #1a1a2e; }
    .date { color: #888; }
    .order-body { display: flex; align-items: center; gap: 16px; }
    .amount { font-size: 1.2rem; font-weight: 700; color: #e94560; }
    .status-badge, .payment-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .status-badge.pending { background: #fef3cd; color: #856404; }
    .status-badge.confirmed { background: #d1ecf1; color: #0c5460; }
    .status-badge.processing { background: #cce5ff; color: #004085; }
    .status-badge.shipped { background: #d4edda; color: #155724; }
    .status-badge.delivered { background: #d4edda; color: #155724; }
    .status-badge.cancelled { background: #f8d7da; color: #721c24; }
    .status-badge.failed { background: #f8d7da; color: #721c24; }
    .payment-badge.completed { background: #d4edda; color: #155724; }
    .payment-badge.pending { background: #fef3cd; color: #856404; }
    .payment-badge.failed { background: #f8d7da; color: #721c24; }
    .empty { text-align: center; padding: 48px; color: #666; }
  `]
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  activeFilter = '';
  filters = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  constructor(private orderService: OrderService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const userId = this.authService.getCurrentUser()?.userId;
    if (userId) {
      this.orderService.getCustomerOrders(userId).subscribe(res => {
        if (res.success && res.data) this.orders = res.data.content;
      });
    }
  }

  filterOrders(status: string): void {
    this.activeFilter = status;
    const userId = this.authService.getCurrentUser()?.userId;
    if (userId) {
      this.orderService.getCustomerOrders(userId).subscribe(res => {
        if (res.success && res.data) {
          this.orders = status ? res.data.content.filter(o => o.orderStatus === status) : res.data.content;
        }
      });
    }
  }
}
