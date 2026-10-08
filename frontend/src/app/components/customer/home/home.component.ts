import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product, Category } from '../../../models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Discover Amazing Products</h1>
          <p>Shop the latest trends with incredible deals and fast delivery</p>
          <a routerLink="/products" class="hero-btn">Shop Now →</a>
        </div>
      </section>

      <!-- Categories -->
      <section class="section" *ngIf="categories.length">
        <h2 class="section-title">Shop by Category</h2>
        <div class="categories-grid">
          <a *ngFor="let cat of categories" [routerLink]="['/products']"
             [queryParams]="{category: cat.id}" class="category-card">
            <span class="cat-icon">{{getCategoryIcon(cat.name)}}</span>
            <span class="cat-name">{{cat.name}}</span>
          </a>
        </div>
      </section>

      <!-- Featured Products -->
      <section class="section">
        <h2 class="section-title">Featured Products</h2>
        <div class="products-grid">
          <div *ngFor="let product of products" class="product-card" [routerLink]="['/products', product.id]">
            <div class="product-image">
              <img [src]="product.imageUrl || 'https://placehold.co/400x300/3b82f6/ffffff?text=Product'"
                   [alt]="product.name" />
              <span *ngIf="product.discountPercentage > 0" class="discount-badge">
                -{{product.discountPercentage}}%
              </span>
            </div>
            <div class="product-info">
              <p class="product-brand">{{product.brand}}</p>
              <h3 class="product-name">{{product.name}}</h3>
              <div class="product-rating">
                <span class="stars">{{'★'.repeat(Math.round(product.rating))}}</span>
                <span class="rating-text">{{product.rating}}</span>
              </div>
              <div class="product-price">
                <span class="final-price">\${{product.finalPrice.toFixed(2)}}</span>
                <span *ngIf="product.discountPercentage > 0" class="original-price">
                  \${{product.price.toFixed(2)}}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="view-all">
          <a routerLink="/products" class="view-all-btn">View All Products →</a>
        </div>
      </section>

      <!-- Why Shop With Us -->
      <section class="features">
        <div class="feature">
          <span class="feature-icon">🚚</span>
          <h3>Free Shipping</h3>
          <p>On orders over $100</p>
        </div>
        <div class="feature">
          <span class="feature-icon">🔒</span>
          <h3>Secure Payment</h3>
          <p>100% secure checkout</p>
        </div>
        <div class="feature">
          <span class="feature-icon">↩️</span>
          <h3>Easy Returns</h3>
          <p>30-day return policy</p>
        </div>
        <div class="feature">
          <span class="feature-icon">💬</span>
          <h3>24/7 Support</h3>
          <p>Dedicated support team</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 80px 24px; text-align: center; }
    .hero-content h1 { font-size: 3rem; font-weight: 800; margin-bottom: 16px; }
    .hero-content p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 32px; }
    .hero-btn { display: inline-block; background: #e94560; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1.1rem; transition: transform 0.2s; }
    .hero-btn:hover { transform: translateY(-2px); }
    .section { max-width: 1200px; margin: 0 auto; padding: 48px 24px; }
    .section-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 32px; color: #1a1a2e; }
    .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
    .category-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; background: white; border-radius: 12px; text-decoration: none; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }
    .category-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .cat-icon { font-size: 2.5rem; }
    .cat-name { font-weight: 600; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
    .product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .product-image { position: relative; height: 200px; overflow: hidden; }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    .discount-badge { position: absolute; top: 8px; left: 8px; background: #e94560; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; }
    .product-info { padding: 16px; }
    .product-brand { color: #888; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .product-name { font-size: 1rem; font-weight: 600; margin: 4px 0; color: #1a1a2e; }
    .product-rating { display: flex; align-items: center; gap: 4px; margin: 8px 0; }
    .stars { color: #f59e0b; font-size: 0.9rem; }
    .rating-text { color: #888; font-size: 0.85rem; }
    .product-price { display: flex; align-items: center; gap: 8px; }
    .final-price { font-size: 1.2rem; font-weight: 700; color: #e94560; }
    .original-price { text-decoration: line-through; color: #999; font-size: 0.9rem; }
    .view-all { text-align: center; margin-top: 32px; }
    .view-all-btn { display: inline-block; padding: 12px 32px; border: 2px solid #1a1a2e; color: #1a1a2e; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.2s; }
    .view-all-btn:hover { background: #1a1a2e; color: white; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; padding: 48px 24px; }
    .feature { text-align: center; padding: 24px; }
    .feature-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
    .feature h3 { margin-bottom: 8px; color: #1a1a2e; }
    .feature p { color: #666; }
  `]
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  Math = Math;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getProducts(0, 8).subscribe(response => {
      if (response.success && response.data) {
        this.products = response.data.content;
      }
    });

    this.productService.getCategories().subscribe(response => {
      if (response.success && response.data) {
        this.categories = response.data;
      }
    });
  }

  getCategoryIcon(name: string): string {
    const icons: Record<string, string> = {
      'Electronics': '📱', 'Clothing': '👕', 'Home & Kitchen': '🏠',
      'Books': '📚', 'Sports': '⚽', 'Beauty': '💄', 'Toys': '🎮', 'Automotive': '🚗'
    };
    return icons[name] || '📦';
  }
}
