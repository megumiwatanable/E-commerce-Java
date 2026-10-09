import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { Product } from '../../../models/product.model';
import { InventoryService, InventoryStatus } from '../../../services/inventory.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-page" *ngIf="product">
      <div class="detail-container">
        <div class="product-image">
          <img [src]="product.imageUrl || 'https://placehold.co/600x400/3b82f6/ffffff?text=Product'" [alt]="product.name" />
          <span *ngIf="product.discountPercentage > 0" class="discount-badge">-{{product.discountPercentage}}%</span>
        </div>
        <div class="product-info">
          <p class="brand">{{product.brand}}</p>
          <h1>{{product.name}}</h1>
          <div class="rating">
            <span class="stars">{{'★'.repeat(Math.round(product.rating))}}</span>
            <span class="rating-text">{{product.rating}} rating</span>
          </div>
          <div class="price-section">
            <span class="final-price">\${{product.finalPrice.toFixed(2)}}</span>
            <span *ngIf="product.discountPercentage > 0" class="original-price">\${{product.price.toFixed(2)}}</span>
            <span *ngIf="product.discountPercentage > 0" class="save-text">You save {{product.discountPercentage}}%</span>
          </div>
          <p class="description">{{product.description}}</p>
          <div class="sku">SKU: {{product.sku}}</div>
          <div *ngIf="stockLoading" class="stock-status loading">Checking availability…</div>
          <div *ngIf="!stockLoading" class="stock-status" [class.out]="!canPurchase" [class.low]="stock?.stockStatus === 'LOW_STOCK'">
            <span></span>{{stockLabel}}
          </div>
          <div class="quantity-selector">
            <label>Quantity:</label>
            <button (click)="decrementQty()">-</button>
            <span>{{quantity}}</span>
            <button (click)="incrementQty()" [disabled]="!canIncrement">+</button>
            <small *ngIf="stock">Maximum {{stock.availableQuantity}}</small>
          </div>
          <div class="actions">
            <button class="add-cart" (click)="addToCart()" [disabled]="!canPurchase || stockLoading">{{canPurchase ? 'Add to Cart' : 'Out of stock'}}</button>
            <button class="buy-now" (click)="buyNow()" [disabled]="!canPurchase || stockLoading">Buy Now</button>
          </div>
          <div class="features">
            <p>🚚 Free shipping on orders over $100</p>
            <p>↩️ 30-day return policy</p>
            <p>🔒 Secure payment</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    .detail-container { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .product-image { position: relative; }
    .product-image img { width: 100%; border-radius: 8px; object-fit: cover; }
    .discount-badge { position: absolute; top: 12px; left: 12px; background: #e94560; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 700; }
    .brand { color: #888; text-transform: uppercase; letter-spacing: 1px; font-size: 0.85rem; }
    h1 { color: #1a1a2e; font-size: 1.8rem; margin: 8px 0 16px; }
    .rating { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; }
    .stars { color: #f59e0b; font-size: 1.2rem; }
    .rating-text { color: #666; }
    .price-section { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
    .final-price { font-size: 2rem; font-weight: 700; color: #e94560; }
    .original-price { text-decoration: line-through; color: #999; font-size: 1.2rem; }
    .save-text { color: #16a34a; font-weight: 600; font-size: 0.9rem; }
    .description { color: #555; line-height: 1.7; margin: 16px 0; }
    .sku { color: #888; font-size: 0.85rem; margin-bottom: 16px; }
    .stock-status{display:flex;align-items:center;gap:8px;color:#18724b;font-weight:800;font-size:.86rem}.stock-status span{width:9px;height:9px;border-radius:50%;background:currentColor}.stock-status.low{color:#a56812}.stock-status.out{color:#b34135}.stock-status.loading{color:#788292}.stock-status.loading span{display:none}
    .quantity-selector { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
    .quantity-selector label { font-weight: 600; }
    .quantity-selector button { width: 36px; height: 36px; border: 1px solid #ddd; background: white; border-radius: 6px; font-size: 1.1rem; cursor: pointer; }
    .quantity-selector span { font-size: 1.1rem; font-weight: 600; min-width: 30px; text-align: center; }
    .quantity-selector small{color:#7b8594}.quantity-selector button:disabled,.actions button:disabled{opacity:.45;cursor:not-allowed}
    .actions { display: flex; gap: 12px; margin: 24px 0; }
    .add-cart { flex: 1; padding: 14px; background: #1a1a2e; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; }
    .add-cart:hover { background: #16213e; }
    .buy-now { flex: 1; padding: 14px; background: #e94560; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; }
    .buy-now:hover { background: #d63851; }
    .features { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; }
    .features p { margin: 8px 0; color: #555; }
  `]
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  stock?: InventoryStatus;
  stockLoading = true;
  quantity = 1;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private cartService: CartService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productService.getProductById(+params['id']).subscribe(res => {
        if (res.success && res.data) { this.product = res.data; this.loadStock(res.data.id); }
      });
    });
  }

  incrementQty(): void { if (this.canIncrement) this.quantity++; }
  decrementQty(): void { if (this.quantity > 1) this.quantity--; }
  get canPurchase(): boolean { return !!this.stock && this.stock.availableQuantity > 0; }
  get canIncrement(): boolean { return this.canPurchase && this.quantity < (this.stock?.availableQuantity || 0); }
  get stockLabel(): string { if (!this.stock) return 'Inventory unavailable'; if (!this.stock.availableQuantity) return 'Out of stock'; if (this.stock.stockStatus === 'LOW_STOCK') return `Low stock — only ${this.stock.availableQuantity} left`; return `In stock — ${this.stock.availableQuantity} available`; }
  private loadStock(productId:number):void { this.stockLoading=true;this.inventoryService.getByProduct(productId).subscribe({next:r=>{this.stock=r.data;this.stockLoading=false;this.quantity=Math.min(this.quantity,Math.max(1,this.stock?.availableQuantity||1))},error:()=>{this.stock=undefined;this.stockLoading=false;}}); }

  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity).subscribe({
        next: () => this.toast.success(`${this.product?.name} was added to your cart.`),
        error: error => this.toast.error(error.error?.message || 'Failed to add this product to your cart.')
      });
    }
  }

  buyNow(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity).subscribe({
        next: () => this.router.navigate(['/checkout']),
        error: error => this.toast.error(error.error?.message || 'This product could not be added.')
      });
    }
  }
}
