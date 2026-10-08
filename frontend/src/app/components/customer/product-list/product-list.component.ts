import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { Product, Category, PageResponse } from '../../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="catalog-page">
      <div class="catalog-container">
        <!-- Filters Sidebar -->
        <aside class="filters">
          <h3>Filters</h3>
          <div class="filter-group">
            <label>Category</label>
            <select [(ngModel)]="selectedCategory" (change)="applyFilters()">
              <option value="">All Categories</option>
              <option *ngFor="let cat of categories" [value]="cat.id">{{cat.name}}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Min Price</label>
            <input type="number" [(ngModel)]="minPrice" placeholder="Min" (change)="applyFilters()" />
          </div>
          <div class="filter-group">
            <label>Max Price</label>
            <input type="number" [(ngModel)]="maxPrice" placeholder="Max" (change)="applyFilters()" />
          </div>
          <button class="clear-btn" (click)="clearFilters()">Clear Filters</button>
        </aside>

        <!-- Products -->
        <main class="products-main">
          <div class="products-header">
            <h2>{{searchQuery ? 'Search: ' + searchQuery : 'All Products'}}</h2>
            <div class="sort-controls">
              <select [(ngModel)]="sortBy" (change)="loadProducts()">
                <option value="createdAt">Newest</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
                <option value="rating">Rating</option>
              </select>
              <button (click)="toggleSortDir()" class="sort-dir-btn">
                {{sortDir === 'asc' ? '↑' : '↓'}}
              </button>
            </div>
          </div>

          <div *ngIf="loading" class="loading">Loading products...</div>

          <div *ngIf="!loading && products.length === 0" class="empty-state">
            <p>🔍 No products found</p>
          </div>

          <div class="products-grid">
            <div *ngFor="let product of products" class="product-card" [routerLink]="['/products', product.id]">
              <div class="product-image">
                <img [src]="product.imageUrl || 'https://placehold.co/400x300/3b82f6/ffffff?text=Product'" [alt]="product.name" />
                <span *ngIf="product.discountPercentage > 0" class="discount-badge">-{{product.discountPercentage}}%</span>
              </div>
              <div class="product-info">
                <p class="brand">{{product.brand}}</p>
                <h3 class="name">{{product.name}}</h3>
                <div class="rating">
                  <span class="stars">{{'★'.repeat(Math.round(product.rating))}}</span>
                  <span>{{product.rating}}</span>
                </div>
                <div class="price">
                  <span class="final">\${{product.finalPrice.toFixed(2)}}</span>
                  <span *ngIf="product.discountPercentage > 0" class="original">\${{product.price.toFixed(2)}}</span>
                </div>
                <button class="add-cart-btn" (click)="addToCart(product, $event)">Add to Cart</button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination" *ngIf="totalPages > 1">
            <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">← Prev</button>
            <span>Page {{currentPage + 1}} of {{totalPages}}</span>
            <button [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)">Next →</button>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .catalog-container { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }
    .filters { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); height: fit-content; position: sticky; top: 80px; }
    .filters h3 { margin-bottom: 16px; color: #1a1a2e; }
    .filter-group { margin-bottom: 16px; }
    .filter-group label { display: block; margin-bottom: 6px; font-weight: 600; color: #555; font-size: 0.9rem; }
    .filter-group select, .filter-group input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
    .clear-btn { width: 100%; padding: 10px; background: #f5f5f5; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; color: #666; }
    .products-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .products-header h2 { color: #1a1a2e; }
    .sort-controls { display: flex; gap: 8px; }
    .sort-controls select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; }
    .sort-dir-btn { padding: 8px 12px; background: #1a1a2e; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
    .product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); cursor: pointer; transition: transform 0.2s; }
    .product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .product-image { height: 180px; overflow: hidden; position: relative; }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    .discount-badge { position: absolute; top: 8px; left: 8px; background: #e94560; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
    .product-info { padding: 16px; }
    .brand { color: #888; font-size: 0.8rem; text-transform: uppercase; }
    .name { font-size: 0.95rem; font-weight: 600; margin: 4px 0; color: #1a1a2e; }
    .rating { display: flex; gap: 4px; align-items: center; margin: 6px 0; font-size: 0.85rem; color: #666; }
    .stars { color: #f59e0b; }
    .price { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
    .final { font-weight: 700; color: #e94560; font-size: 1.1rem; }
    .original { text-decoration: line-through; color: #999; font-size: 0.85rem; }
    .add-cart-btn { width: 100%; padding: 10px; background: #1a1a2e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
    .add-cart-btn:hover { background: #e94560; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 32px; }
    .pagination button { padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading, .empty-state { text-align: center; padding: 48px; color: #666; font-size: 1.1rem; }
  `]
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  currentPage = 0;
  totalPages = 0;
  sortBy = 'createdAt';
  sortDir = 'desc';
  selectedCategory = '';
  minPrice?: number;
  maxPrice?: number;
  searchQuery = '';
  loading = true;
  Math = Math;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productService.getCategories().subscribe(res => {
      if (res.success && res.data) this.categories = res.data;
    });

    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.selectedCategory = params['category'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading = true;
    if (this.searchQuery) {
      this.productService.searchProducts(this.searchQuery, this.currentPage, 12).subscribe(res => {
        this.handleResponse(res.data);
      });
    } else if (this.selectedCategory) {
      this.productService.getProductsByCategory(+this.selectedCategory, this.currentPage, 12).subscribe(res => {
        this.handleResponse(res.data);
      });
    } else {
      this.productService.getFilteredProducts(
        this.selectedCategory ? +this.selectedCategory : undefined,
        undefined, this.minPrice, this.maxPrice,
        this.currentPage, 12, this.sortBy, this.sortDir
      ).subscribe(res => {
        this.handleResponse(res.data);
      });
    }
  }

  handleResponse(pageData: any): void {
    this.loading = false;
    if (pageData) {
      this.products = pageData.content;
      this.totalPages = pageData.totalPages;
    }
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.searchQuery = '';
    this.router.navigate(['/products']);
    this.currentPage = 0;
    this.loadProducts();
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.loadProducts();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => alert('Added to cart!'),
      error: () => alert('Failed to add to cart')
    });
  }
}
