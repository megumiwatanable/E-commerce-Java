import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { Cart } from '../../../models/order.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cart-page">
      <h1>Shopping Cart</h1>
      <div *ngIf="!cart || cart.items.length === 0" class="empty-cart">
        <p>🛒 Your cart is empty</p>
        <a routerLink="/products" class="shop-btn">Start Shopping</a>
      </div>
      <div *ngIf="cart && cart.items.length > 0" class="cart-container">
        <div class="cart-items">
          <div *ngFor="let item of cart.items" class="cart-item">
            <img [src]="item.imageUrl || 'https://placehold.co/100x100/3b82f6/ffffff?text=Item'" [alt]="item.productName" />
            <div class="item-details">
              <h3>{{item.productName}}</h3>
              <p class="sku">SKU: {{item.sku}}</p>
              <p class="price">\${{item.unitPrice.toFixed(2)}}</p>
            </div>
            <div class="quantity-controls">
              <button (click)="updateQuantity(item.productId, item.quantity - 1)">-</button>
              <span>{{item.quantity}}</span>
              <button (click)="updateQuantity(item.productId, item.quantity + 1)">+</button>
            </div>
            <p class="subtotal">\${{item.subtotal.toFixed(2)}}</p>
            <button class="remove-btn" (click)="removeItem(item.productId)">✕</button>
          </div>
        </div>
        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="summary-row"><span>Subtotal ({{cart.totalItems}} items)</span><span>\${{cart.subtotal.toFixed(2)}}</span></div>
          <div class="summary-row"><span>Shipping</span><span>{{cart.subtotal >= 100 ? 'Free' : '$9.99'}}</span></div>
          <div class="summary-row"><span>Tax (18% GST)</span><span>\${{(cart.subtotal * 0.18).toFixed(2)}}</span></div>
          <hr />
          <div class="summary-row total">
            <span>Total</span>
            <span>\${{(cart.subtotal + (cart.subtotal >= 100 ? 0 : 9.99) + cart.subtotal * 0.18).toFixed(2)}}</span>
          </div>
          <button class="checkout-btn" (click)="checkout()">Proceed to Checkout →</button>
          <a routerLink="/products" class="continue-link">← Continue Shopping</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    h1 { color: #1a1a2e; margin-bottom: 24px; }
    .empty-cart { text-align: center; padding: 64px; }
    .empty-cart p { font-size: 1.3rem; color: #666; margin-bottom: 24px; }
    .shop-btn { display: inline-block; padding: 12px 32px; background: #e94560; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .cart-container { display: grid; grid-template-columns: 1fr 360px; gap: 32px; }
    .cart-item { display: flex; align-items: center; gap: 16px; padding: 20px; background: white; border-radius: 10px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .cart-item img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }
    .item-details { flex: 1; }
    .item-details h3 { font-size: 1rem; margin-bottom: 4px; color: #1a1a2e; }
    .sku { color: #888; font-size: 0.8rem; }
    .price { font-weight: 600; color: #e94560; margin-top: 4px; }
    .quantity-controls { display: flex; align-items: center; gap: 8px; }
    .quantity-controls button { width: 32px; height: 32px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    .quantity-controls span { font-weight: 600; min-width: 24px; text-align: center; }
    .subtotal { font-weight: 700; color: #1a1a2e; min-width: 80px; text-align: right; }
    .remove-btn { background: none; border: none; color: #999; font-size: 1.2rem; cursor: pointer; padding: 4px; }
    .remove-btn:hover { color: #e94560; }
    .cart-summary { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); height: fit-content; position: sticky; top: 80px; }
    .cart-summary h3 { margin-bottom: 16px; color: #1a1a2e; }
    .summary-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .summary-row.total { font-size: 1.2rem; font-weight: 700; color: #1a1a2e; }
    hr { border: none; border-top: 1px solid #eee; margin: 12px 0; }
    .checkout-btn { width: 100%; padding: 14px; background: #e94560; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 16px; }
    .checkout-btn:hover { background: #d63851; }
    .continue-link { display: block; text-align: center; margin-top: 12px; color: #666; text-decoration: none; }
    .continue-link:hover { color: #e94560; }
  `]
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => this.cart = cart);
    this.cartService.getCart().subscribe();
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) return;
    this.cartService.updateQuantity(productId, quantity).subscribe();
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId).subscribe();
  }

  checkout(): void {
    this.router.navigate(['/checkout']);
  }
}
