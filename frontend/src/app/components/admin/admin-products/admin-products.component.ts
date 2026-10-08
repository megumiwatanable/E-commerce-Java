import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { Product, Category, PageResponse } from '../../../models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Product Management</h1>
        <button class="add-btn" (click)="showForm = !showForm">+ Add Product</button>
      </div>

      <div *ngIf="showForm" class="form-card">
        <h3>{{editingProduct ? 'Edit Product' : 'Add Product'}}</h3>
        <form (ngSubmit)="saveProduct()">
          <div class="form-row">
            <div class="form-group"><label>SKU</label><input [(ngModel)]="form.sku" name="sku" required /></div>
            <div class="form-group"><label>Name</label><input [(ngModel)]="form.name" name="name" required /></div>
          </div>
          <div class="form-group"><label>Description</label><textarea [(ngModel)]="form.description" name="description"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Category</label>
              <select [(ngModel)]="form.categoryId" name="categoryId" required>
                <option *ngFor="let cat of categories" [value]="cat.id">{{cat.name}}</option>
              </select>
            </div>
            <div class="form-group"><label>Brand</label><input [(ngModel)]="form.brand" name="brand" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Price</label><input type="number" [(ngModel)]="form.price" name="price" required step="0.01" /></div>
            <div class="form-group"><label>Discount %</label><input type="number" [(ngModel)]="form.discountPercentage" name="discount" step="0.01" /></div>
          </div>
          <div class="form-group"><label>Image URL</label><input [(ngModel)]="form.imageUrl" name="imageUrl" /></div>
          <div class="btn-group">
            <button type="submit" class="save-btn">Save</button>
            <button type="button" class="cancel-btn" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>

      <table class="data-table">
        <thead>
          <tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Discount</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of products">
            <td>{{p.sku}}</td>
            <td>{{p.name}}</td>
            <td>{{p.categoryName || '-'}}</td>
            <td>\${{p.finalPrice.toFixed(2)}}</td>
            <td>{{p.discountPercentage}}%</td>
            <td><span class="badge" [class]="p.status.toLowerCase()">{{p.status}}</span></td>
            <td>
              <button class="action-btn edit" (click)="editProduct(p)">Edit</button>
              <button class="action-btn delete" (click)="deleteProduct(p.id)">Delete</button>
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    h1 { color: #1a1a2e; }
    .add-btn { padding: 10px 20px; background: #e94560; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .form-card { background: white; padding: 24px; border-radius: 10px; margin-bottom: 20px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; margin-bottom: 4px; font-weight: 600; font-size: 0.9rem; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
    .form-group textarea { height: 60px; }
    .btn-group { display: flex; gap: 8px; }
    .save-btn { padding: 10px 24px; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .cancel-btn { padding: 10px 24px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer; }
    .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; }
    .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    .data-table th { background: #f8f9fa; font-weight: 600; color: #555; }
    .action-btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; margin-right: 4px; }
    .action-btn.edit { background: #dbeafe; color: #1e40af; }
    .action-btn.delete { background: #fee; color: #e94560; }
    .badge { padding: 4px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .badge.active { background: #d4edda; color: #155724; }
    .badge.inactive { background: #f8f9fa; color: #6c757d; }
    .pagination { display: flex; justify-content: center; gap: 16px; margin-top: 16px; }
    .pagination button { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
  `]
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  currentPage = 0;
  showForm = false;
  editingProduct?: Product;
  form: any = {};

  constructor(private productService: ProductService) {}
  ngOnInit(): void {
    this.loadProducts();
    this.productService.getCategories().subscribe(res => {
      if (res.success && res.data) this.categories = res.data;
    });
  }

  prevPage(): void { this.currentPage--; this.loadProducts(); }
  nextPage(): void { this.currentPage++; this.loadProducts(); }

  loadProducts(): void {
    this.productService.getProducts(this.currentPage, 10).subscribe(res => {
      if (res.success && res.data) this.products = res.data.content;
    });
  }

  editProduct(p: Product): void {
    this.editingProduct = p;
    this.form = { ...p };
    this.showForm = true;
  }

  saveProduct(): void {
    if (this.editingProduct) {
      this.productService.updateProduct(this.editingProduct.id, this.form).subscribe(() => {
        this.cancelEdit(); this.loadProducts();
      });
    } else {
      this.productService.createProduct(this.form).subscribe(() => {
        this.cancelEdit(); this.loadProducts();
      });
    }
  }

  deleteProduct(id: number): void {
    if (confirm('Delete this product?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadProducts());
    }
  }

  cancelEdit(): void { this.showForm = false; this.editingProduct = undefined; this.form = {}; }
}
