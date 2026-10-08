import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../services/payment.service';
import { Payment } from '../../../models/order.model';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <h1>Payment Management</h1>
      <div class="filters">
        <select [(ngModel)]="statusFilter" (change)="loadPayments()">
          <option value="">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>
      <table class="data-table">
        <thead><tr><th>Reference</th><th>Order ID</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          <tr *ngFor="let p of payments">
            <td><strong>{{p.paymentReference}}</strong></td>
            <td>{{p.orderId}}</td><td>{{p.customerId}}</td>
            <td>\${{p.amount.toFixed(2)}}</td><td>{{p.paymentMethod}}</td>
            <td><span class="badge" [class]="p.status.toLowerCase()">{{p.status}}</span></td>
            <td>{{p.transactionDate | date:'short'}}</td>
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
    .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; }
    .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    .data-table th { background: #f8f9fa; font-weight: 600; color: #555; }
    .badge { padding: 4px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .badge.completed { background: #d4edda; color: #155724; }
    .badge.failed { background: #f8d7da; color: #721c24; }
    .badge.pending { background: #fef3cd; color: #856404; }
    .pagination { display: flex; justify-content: center; gap: 16px; margin-top: 16px; }
    .pagination button { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
  `]
})
export class AdminPaymentsComponent implements OnInit {
  payments: Payment[] = [];
  currentPage = 0;
  statusFilter = '';
  constructor(private paymentService: PaymentService) {}
  ngOnInit(): void { this.loadPayments(); }
  prevPage(): void { this.currentPage--; this.loadPayments(); }
  nextPage(): void { this.currentPage++; this.loadPayments(); }

  loadPayments(): void {
    this.paymentService.getAllPayments(this.currentPage, 10, this.statusFilter || undefined).subscribe(res => {
      if (res.success && res.data) this.payments = res.data.content;
    });
  }
}
