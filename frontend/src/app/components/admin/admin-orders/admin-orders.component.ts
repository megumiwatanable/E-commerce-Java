import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <h1>Order Management</h1>
      <div class="filters">
        <select [(ngModel)]="statusFilter" (change)="loadOrders()">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer ID</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of orders">
            <td><strong>{{order.orderNumber}}</strong></td>
            <td>{{order.customerId}}</td>
            <td>{{order.createdAt | date:'short'}}</td>
            <td>\${{order.finalAmount.toFixed(2)}}</td>
            <td><span class="badge" [class]="order.paymentStatus.toLowerCase()">{{order.paymentStatus}}</span></td>
            <td><span class="badge" [class]="order.orderStatus.toLowerCase()">{{order.orderStatus}}</span></td>
            <td>
              <select *ngIf="canUpdateStatus(order)" [(ngModel)]="newStatus" (change)="updateStatus(order)">
                <option value="">Update Status</option>
                <option *ngFor="let s of getValidTransitions(order.orderStatus)" [value]="s">{{s.replace('_', ' ')}}</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button [disabled]="currentPage === 0" (click)="prevPage()">← Prev</button>
        <span>Page {{currentPage + 1}}</span>
        <button (click)="nextPage()">Next →</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { padding: 0; }
    h1 { color: #1a1a2e; margin-bottom: 20px; }
    .filters { margin-bottom: 16px; }
    .filters select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; }
    .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    .data-table th { background: #f8f9fa; font-weight: 600; color: #555; }
    .data-table select { padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; }
    .badge { padding: 4px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .badge.pending { background: #fef3cd; color: #856404; }
    .badge.confirmed { background: #d1ecf1; color: #0c5460; }
    .badge.processing { background: #cce5ff; color: #004085; }
    .badge.shipped { background: #d4edda; color: #155724; }
    .badge.out_for_delivery { background: #d4edda; color: #155724; }
    .badge.delivered { background: #d4edda; color: #155724; }
    .badge.completed { background: #d4edda; color: #155724; }
    .badge.cancelled, .badge.failed { background: #f8d7da; color: #721c24; }
    .pagination { display: flex; justify-content: center; gap: 16px; margin-top: 16px; }
    .pagination button { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  currentPage = 0;
  statusFilter = '';
  newStatus = '';

  transitions: Record<string, string[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['OUT_FOR_DELIVERY'],
    'OUT_FOR_DELIVERY': ['DELIVERED']
  };

  constructor(private orderService: OrderService) {}
  ngOnInit(): void { this.loadOrders(); }

  prevPage(): void { this.currentPage--; this.loadOrders(); }
  nextPage(): void { this.currentPage++; this.loadOrders(); }

  loadOrders(): void {
    this.orderService.getAllOrders(this.currentPage, 10, this.statusFilter || undefined).subscribe(res => {
      if (res.success && res.data) this.orders = res.data.content;
    });
  }

  canUpdateStatus(order: Order): boolean {
    return !!this.transitions[order.orderStatus];
  }

  getValidTransitions(status: string): string[] {
    return this.transitions[status] || [];
  }

  updateStatus(order: Order): void {
    if (this.newStatus) {
      this.orderService.updateOrderStatus(order.id, this.newStatus).subscribe(res => {
        if (res.success) { this.loadOrders(); this.newStatus = ''; }
      });
    }
  }
}
