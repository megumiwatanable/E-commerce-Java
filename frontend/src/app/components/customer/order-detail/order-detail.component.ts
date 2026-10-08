import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-page" *ngIf="order">
      <h1>Order Details</h1>
      <div class="order-info">
        <div class="info-row"><span>Order Number:</span><strong>{{order.orderNumber}}</strong></div>
        <div class="info-row"><span>Date:</span><span>{{order.createdAt | date:'medium'}}</span></div>
        <div class="info-row"><span>Status:</span><span class="status" [class]="order.orderStatus.toLowerCase()">{{order.orderStatus}}</span></div>
        <div class="info-row"><span>Payment:</span><span class="status" [class]="order.paymentStatus.toLowerCase()">{{order.paymentStatus}}</span></div>
      </div>

      <div class="timeline">
        <h3>Order Timeline</h3>
        <div class="timeline-items">
          <div *ngFor="let s of statusList; let i = index" class="timeline-item"
               [class.active]="isStatusReached(s)" [class.current]="order.orderStatus === s">
            <div class="dot"></div>
            <span>{{s.replace('_', ' ')}}</span>
          </div>
        </div>
      </div>

      <div class="items-section">
        <h3>Items</h3>
        <div *ngFor="let item of order.items" class="item-row">
          <span>{{item.productName}} (×{{item.quantity}})</span>
          <span>\${{item.totalPrice.toFixed(2)}}</span>
        </div>
      </div>

      <div class="summary">
        <div class="row"><span>Subtotal:</span><span>\${{order.totalAmount.toFixed(2)}}</span></div>
        <div class="row"><span>Tax:</span><span>\${{order.taxAmount.toFixed(2)}}</span></div>
        <div class="row"><span>Shipping:</span><span>{{order.shippingAmount === 0 ? 'Free' : '$' + order.shippingAmount.toFixed(2)}}</span></div>
        <hr />
        <div class="row total"><span>Total:</span><span>\${{order.finalAmount.toFixed(2)}}</span></div>
      </div>

      <div class="address-section">
        <h3>Shipping Address</h3>
        <p>{{order.shippingAddress}}</p>
      </div>

      <button *ngIf="canCancel()" class="cancel-btn" (click)="cancelOrder()">Cancel Order</button>
    </div>
  `,
  styles: [`
    .detail-page { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
    h1 { color: #1a1a2e; margin-bottom: 24px; }
    .order-info { background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .status { padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
    .status.pending { background: #fef3cd; color: #856404; }
    .status.confirmed { background: #d1ecf1; color: #0c5460; }
    .status.processing { background: #cce5ff; color: #004085; }
    .status.shipped { background: #d4edda; color: #155724; }
    .status.delivered { background: #d4edda; color: #155724; }
    .status.completed { background: #d4edda; color: #155724; }
    .status.cancelled, .status.failed { background: #f8d7da; color: #721c24; }
    .timeline { background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
    .timeline h3 { margin-bottom: 16px; }
    .timeline-items { display: flex; justify-content: space-between; position: relative; }
    .timeline-items::before { content: ''; position: absolute; top: 10px; left: 10%; right: 10%; height: 3px; background: #e0e0e0; }
    .timeline-item { display: flex; flex-direction: column; align-items: center; z-index: 1; }
    .dot { width: 20px; height: 20px; border-radius: 50%; background: #e0e0e0; margin-bottom: 8px; }
    .timeline-item.active .dot { background: #16a34a; }
    .timeline-item.current .dot { background: #e94560; box-shadow: 0 0 0 4px rgba(233,69,96,0.2); }
    .timeline-item span { font-size: 0.7rem; font-weight: 600; text-align: center; }
    .items-section, .summary, .address-section { background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; }
    h3 { margin-bottom: 12px; color: #1a1a2e; }
    .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .row.total { font-weight: 700; font-size: 1.1rem; }
    hr { border: none; border-top: 1px solid #eee; margin: 8px 0; }
    .cancel-btn { width: 100%; padding: 14px; background: #f8d7da; color: #721c24; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 16px; }
  `]
})
export class OrderDetailComponent implements OnInit {
  order?: Order;
  statusList = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

  ngOnInit(): void {
    this.route.params.subscribe(p => {
      this.orderService.getOrderById(+p['id']).subscribe(res => {
        if (res.success && res.data) {
          this.order = res.data;
          if (!this.order.items?.length) {
            this.orderService.getOrderItems(this.order.id).subscribe(r => {
              if (r.success && r.data) this.order!.items = r.data;
            });
          }
        }
      });
    });
  }

  isStatusReached(status: string): boolean {
    if (!this.order) return false;
    return this.statusList.indexOf(this.order.orderStatus) >= this.statusList.indexOf(status);
  }

  canCancel(): boolean {
    return this.order?.orderStatus === 'PENDING' || this.order?.orderStatus === 'CONFIRMED';
  }

  cancelOrder(): void {
    if (this.order && confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(this.order.id).subscribe(res => {
        if (res.success && res.data) this.order = res.data;
      });
    }
  }
}
