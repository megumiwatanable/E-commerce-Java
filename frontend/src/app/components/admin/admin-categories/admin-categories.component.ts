import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { Category } from '../../../models/product.model';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header"><h1>Category Management</h1>
        <button class="add-btn" (click)="openForm()">+ Add Category</button>
      </div>
      <div *ngIf="showForm" class="form-card">
        <form (ngSubmit)="saveCategory()">
          <div class="form-group"><label>Name</label><input [(ngModel)]="form.name" name="name" required /></div>
          <div class="form-group"><label>Description</label><input [(ngModel)]="form.description" name="description" /></div>
          <div class="btn-group">
            <button type="submit" class="save-btn">{{editingCategory ? 'Update' : 'Create'}}</button>
            <button type="button" class="cancel-btn" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>
      <table class="data-table">
        <thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of categories">
            <td><strong>{{c.name}}</strong></td><td>{{c.description || '-'}}</td>
            <td><span class="badge" [class]="c.status.toLowerCase()">{{c.status}}</span></td>
            <td>
              <button class="action-btn edit" (click)="openForm(c)">Edit</button>
              <button class="action-btn delete" (click)="deleteCategory(c.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .admin-page { padding: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    h1 { color: #1a1a2e; }
    .add-btn { padding: 10px 20px; background: #e94560; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .form-card { background: white; padding: 24px; border-radius: 10px; margin-bottom: 20px; }
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; margin-bottom: 4px; font-weight: 600; }
    .form-group input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
    .btn-group { display: flex; gap: 8px; }
    .save-btn { padding: 10px 24px; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .cancel-btn { padding: 10px 24px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer; }
    .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; }
    .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    .data-table th { background: #f8f9fa; font-weight: 600; color: #555; }
    .action-btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .action-btn.delete { background: #fee; color: #e94560; }
    .action-btn.edit { background: #dbeafe; color: #1e40af; margin-right: 5px; }
    .badge { padding: 4px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .badge.active { background: #d4edda; color: #155724; }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  showForm = false;
  editingCategory?: Category;
  form: any = {};
  constructor(private productService: ProductService, private toast: ToastService, private router: Router) {}
  ngOnInit(): void { this.loadCategories(); }
  loadCategories(): void {
    this.productService.getCategories().subscribe(res => { if (res.success && res.data) this.categories = res.data; });
  }
  saveCategory(): void {
    const request = this.editingCategory
      ? this.productService.updateCategory(this.editingCategory.id, this.form)
      : this.productService.createCategory(this.form);
    request.subscribe({next:()=>{this.toast.success(`Category ${this.editingCategory?'updated':'created'}.`);this.cancelEdit();this.loadCategories()},error:e=>this.toast.error(e.error?.message||'Could not save category.')});
  }
  deleteCategory(id: number): void {
    if (confirm('Delete this category?')) this.productService.deleteCategory(id).subscribe({next:()=>{this.toast.success('Category deactivated.');this.loadCategories()},error:e=>this.toast.error(e.error?.message||'Could not delete category.')});
  }
  openForm(category?:Category):void{this.router.navigate(category?['/admin/categories',category.id,'edit']:['/admin/categories/new'])}
  cancelEdit():void{this.showForm=false;this.editingCategory=undefined;this.form={}}
}
