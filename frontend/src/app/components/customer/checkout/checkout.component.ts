import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';
import { Cart, Order } from '../../../models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="checkout-page">
      <h1>Checkout</h1>
      <div class="steps">
        <div class="step" [class.active]="step >= 1" [class.done]="step > 1">1. Address</div>
        <div class="step" [class.active]="step >= 2" [class.done]="step > 2">2. Review</div>
        <div class="step" [class.active]="step >= 3" [class.done]="step > 3">3. Payment</div>
        <div class="step" [class.active]="step >= 4">4. Confirmation</div>
      </div>

      <!-- Step 1: Address -->
      <div *ngIf="step === 1" class="checkout-section">
        <h2>Shipping Address</h2>
        <form (ngSubmit)="nextStep()">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" [(ngModel)]="address.name" name="name" required placeholder="Full name" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" [(ngModel)]="address.phone" name="phone" required placeholder="Phone number" />
          </div>
          <div class="form-group">
            <label>Address</label>
            <textarea [(ngModel)]="address.line1" name="line1" required placeholder="Street address"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>City</label>
              <input type="text" [(ngModel)]="address.city" name="city" required />
            </div>
            <div class="form-group">
              <label>State</label>
              <input type="text" [(ngModel)]="address.state" name="state" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Pincode</label>
              <input type="text" [(ngModel)]="address.pincode" name="pincode" required />
            </div>
            <div class="form-group">
              <label>Country</label>
              <input type="text" [(ngModel)]="address.country" name="country" value="United States" />
            </div>
          </div>
          <button type="submit" class="next-btn">Continue to Review →</button>
        </form>
      </div>

      <!-- Step 2: Review -->
      <div *ngIf="step === 2" class="checkout-section">
        <h2>Review Order</h2>
        <div class="review-items">
          <div *ngFor="let item of cart?.items" class="review-item">
            <span>{{item.productName}} × {{item.quantity}}</span>
            <span>\${{item.subtotal.toFixed(2)}}</span>
          </div>
        </div>
        <div class="review-address">
          <h3>Shipping to:</h3>
          <p>{{address.name}}, {{address.line1}}, {{address.city}}, {{address.state}} {{address.pincode}}</p>
        </div>
        <div class="review-total">
          <div class="summary-row"><span>Subtotal</span><span>\${{(cart?.subtotal ?? 0).toFixed(2)}}</span></div>
          <div class="summary-row"><span>Shipping</span><span>{{(cart?.subtotal || 0) >= 100 ? 'Free' : '$9.99'}}</span></div>
          <div class="summary-row"><span>Tax (18%)</span><span>\${{((cart?.subtotal || 0) * 0.18).toFixed(2)}}</span></div>
          <hr />
          <div class="summary-row total"><span>Total</span><span>\${{getTotal().toFixed(2)}}</span></div>
        </div>
        <div class="btn-group">
          <button class="back-btn" (click)="step = 1">← Back</button>
          <button class="next-btn" (click)="placeOrder()">Place Order →</button>
        </div>
      </div>

      <!-- Step 3: Payment -->
      <div *ngIf="step === 3" class="checkout-section">
        <h2>Payment Method</h2>
        <div *ngIf="processing" class="processing">
          <div class="spinner"></div>
          <p>Processing payment...</p>
        </div>
        <div *ngIf="!processing && !order" class="payment-methods">
          <div *ngFor="let method of paymentMethods" class="payment-option"
               [class.selected]="selectedPayment === method.value"
               (click)="selectedPayment = method.value">
            <span class="method-icon">{{method.icon}}</span>
            <span class="method-name">{{method.name}}</span>
          </div>

          <div *ngIf="selectedPayment === 'CARD'" class="card-form">
            <div class="form-group">
              <label>Card Number</label>
              <input type="text" placeholder="1234 5678 9012 3456" maxlength="19" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Expiry</label>
                <input type="text" placeholder="MM/YY" maxlength="5" />
              </div>
              <div class="form-group">
                <label>CVV</label>
                <input type="text" placeholder="123" maxlength="3" />
              </div>
            </div>
            <div class="form-group">
              <label>Name on Card</label>
              <input type="text" placeholder="John Doe" />
            </div>
          </div>

          <div *ngIf="paymentError" class="error-alert">{{paymentError}}</div>

          <div class="btn-group">
            <button class="back-btn" (click)="step = 2">← Back</button>
            <button class="pay-btn" (click)="processPayment()" [disabled]="!selectedPayment">
              Pay \${{getTotal().toFixed(2)}}
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4: Confirmation -->
      <div *ngIf="step === 4 && order" class="checkout-section confirmation">
        <div class="success-icon">✓</div>
        <h2>Order Placed Successfully!</h2>
        <div class="order-details">
          <p><strong>Order Number:</strong> {{order.orderNumber}}</p>
          <p><strong>Amount:</strong> \${{order.finalAmount.toFixed(2)}}</p>
          <p><strong>Status:</strong> {{order.orderStatus}}</p>
        </div>
        <div class="btn-group">
          <a [routerLink]="['/order', order.id]" class="next-btn">View Order</a>
          <a routerLink="/products" class="back-btn">Continue Shopping</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
    h1 { color: #1a1a2e; margin-bottom: 24px; }
    .steps { display: flex; gap: 8px; margin-bottom: 32px; }
    .step { flex: 1; text-align: center; padding: 12px; background: #f0f0f0; border-radius: 8px; font-weight: 600; color: #999; }
    .step.active { background: #e94560; color: white; }
    .step.done { background: #16a34a; color: white; }
    .checkout-section { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    h2 { color: #1a1a2e; margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 600; color: #333; }
    .form-group input, .form-group textarea { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; }
    .form-group textarea { height: 80px; resize: vertical; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #e94560; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .review-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
    .review-address { margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; }
    .review-total { margin-top: 20px; }
    .summary-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .summary-row.total { font-size: 1.2rem; font-weight: 700; }
    hr { border: none; border-top: 1px solid #eee; margin: 12px 0; }
    .btn-group { display: flex; gap: 12px; margin-top: 24px; }
    .next-btn, .pay-btn { padding: 14px 32px; background: #e94560; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; text-align: center; }
    .back-btn { padding: 14px 32px; background: #f0f0f0; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .payment-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .payment-option { display: flex; align-items: center; gap: 10px; padding: 16px; border: 2px solid #e0e0e0; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .payment-option.selected { border-color: #e94560; background: #fff5f7; }
    .method-icon { font-size: 1.5rem; }
    .method-name { font-weight: 600; }
    .card-form { grid-column: span 2; }
    .processing { text-align: center; padding: 32px; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f0f0f0; border-top: 4px solid #e94560; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .confirmation { text-align: center; }
    .success-icon { width: 80px; height: 80px; background: #16a34a; color: white; font-size: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .order-details { margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .order-details p { margin: 8px 0; }
    .error-alert { background: #fee; color: #e94560; padding: 12px; border-radius: 8px; margin: 12px 0; text-align: center; }
    .pay-btn { flex: 1; }
    .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class CheckoutComponent implements OnInit {
  step = 1;
  cart: Cart | null = null;
  order?: Order;
  processing = false;
  paymentError = '';
  selectedPayment = 'CARD';
  address = { name: '', phone: '', line1: '', city: '', state: '', pincode: '', country: 'United States' };

  paymentMethods = [
    { value: 'CARD', name: 'Credit/Debit Card', icon: '💳' },
    { value: 'UPI', name: 'UPI', icon: '📱' },
    { value: 'NET_BANKING', name: 'Net Banking', icon: '🏦' },
    { value: 'CASH_ON_DELIVERY', name: 'Cash on Delivery', icon: '💵' }
  ];

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => this.cart = cart ?? null);
    this.cartService.getCart().subscribe();
  }

  nextStep(): void {
    if (this.step === 1) this.step = 2;
  }

  getTotal(): number {
    if (!this.cart) return 0;
    const shipping = this.cart.subtotal >= 100 ? 0 : 9.99;
    const tax = this.cart.subtotal * 0.18;
    return this.cart.subtotal + shipping + tax;
  }

  placeOrder(): void {
    const shippingAddress = `${this.address.name}, ${this.address.line1}, ${this.address.city}, ${this.address.state} ${this.address.pincode}, ${this.address.country}`;
    const items = this.cart?.items.map(item => ({ productId: item.productId, quantity: item.quantity })) || [];

    this.orderService.createOrder(shippingAddress, items).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.order = response.data;
          this.step = 3;
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to create order')
    });
  }

  processPayment(): void {
    if (!this.order) return;
    this.processing = true;
    this.paymentError = '';

    this.paymentService.processPayment(this.order.id, this.order.finalAmount, this.selectedPayment).subscribe({
      next: (response) => {
        this.processing = false;
        if (response.success && response.data?.status === 'COMPLETED') {
          this.order!.paymentStatus = 'COMPLETED';
          this.order!.orderStatus = 'CONFIRMED';
          this.step = 4;
        } else {
          this.paymentError = 'Payment failed. Please try again.';
        }
      },
      error: (err) => {
        this.processing = false;
        this.paymentError = err.error?.message || 'Payment failed';
      }
    });
  }
}
