import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../config/api.config';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <h1>Inventory Management</h1>
      <table class="data-table">
        <thead><tr><th>Product ID</th><th>SKU</th><th>Available</th><th>Reserved</th><th>Reorder Level</th><th>Status</th><th>Location</th></tr></thead>
        <tbody>
          <tr *ngFor="let inv of inventory" [class.low-stock]="inv.stockStatus === 'LOW_STOCK'">
            <td>{{inv.productId}}</td><td>{{inv.sku}}</td>
            <td>{{inv.availableQuantity}}</td><td>{{inv.reservedQuantity}}</td>
            <td>{{inv.reorderLevel}}</td>
            <td><span class="badge" [class]="inv.stockStatus?.toLowerCase()">{{inv.stockStatus}}</span></td>
            <td>{{inv.warehouseLocation || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .admin-page { padding: 0; }
    h1 { color: #1a1a2e; margin-bottom: 20px; }
    .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; }
    .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    .data-table th { background: #f8f9fa; font-weight: 600; color: #555; }
    .low-stock { background: #fff8e1; }
    .badge { padding: 4px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .badge.in_stock { background: #d4edda; color: #155724; }
    .badge.low_stock { background: #fef3cd; color: #856404; }
    .badge.out_of_stock { background: #f8d7da; color: #721c24; }
  `]
})
export class AdminInventoryComponent implements OnInit {
  inventory: any[] = [];
  constructor(private http: HttpClient) {}
  ngOnInit(): void {
    this.http.get<any>(`${API_BASE_URL}/inventory`).subscribe(res => {
      if (res.success && res.data) this.inventory = res.data;
    });
  }
}
