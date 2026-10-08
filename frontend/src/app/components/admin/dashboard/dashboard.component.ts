import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <div class="stats-grid">
        <div class="stat-card" *ngFor="let stat of stats">
          <span class="stat-icon">{{stat.icon}}</span>
          <div class="stat-info">
            <span class="stat-value">{{stat.value}}</span>
            <span class="stat-label">{{stat.label}}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 0; }
    h1 { color: #1a1a2e; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .stat-card { background: white; border-radius: 12px; padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .stat-icon { font-size: 2rem; }
    .stat-value { display: block; font-size: 1.8rem; font-weight: 700; color: #1a1a2e; }
    .stat-label { color: #888; font-size: 0.9rem; }
  `]
})
export class DashboardComponent implements OnInit {
  stats: { icon: string; value: number | string; label: string }[] = [];

  constructor(private orderService: OrderService, private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.orderService.getDashboardStats().subscribe(res => {
      if (res.success && res.data) {
        const d = res.data;
        this.stats = [
          { icon: '📦', value: d.totalOrders || 0, label: 'Total Orders' },
          { icon: '⏳', value: d.pendingOrders || 0, label: 'Pending Orders' },
          { icon: '✅', value: d.confirmedOrders || 0, label: 'Confirmed' },
          { icon: '🚚', value: d.shippedOrders || 0, label: 'Shipped' },
          { icon: '🎉', value: d.deliveredOrders || 0, label: 'Delivered' },
          { icon: '❌', value: d.cancelledOrders || 0, label: 'Cancelled' },
          { icon: '🚫', value: d.failedOrders || 0, label: 'Failed' }
        ];
      }
    });

    this.paymentService.getPaymentStats().subscribe(res => {
      if (res.success && res.data) {
        this.stats.push(
          { icon: '💳', value: res.data.successfulPayments || 0, label: 'Successful Payments' },
          { icon: '⚠️', value: res.data.failedPayments || 0, label: 'Failed Payments' }
        );
      }
    });
  }
}
