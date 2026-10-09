import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryStatus } from '../../../services/inventory.service';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-inventory', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header"><div><h1>Inventory</h1><p>Manage sellable and reserved stock by product.</p></div><button class="primary" (click)="openCreate()">+ Add inventory</button></div>
      <form *ngIf="showForm" (ngSubmit)="save()" class="form-card">
        <h2>{{editing ? 'Edit inventory' : 'Add inventory'}}</h2>
        <div class="grid">
          <label>Product<select [(ngModel)]="form.productId" name="productId" required [disabled]="!!editing" (change)="selectProduct()"><option [ngValue]="undefined">Select product</option><option *ngFor="let p of products" [ngValue]="p.id">{{p.name}} · {{p.sku}}</option></select></label>
          <label>SKU<input [(ngModel)]="form.sku" name="sku" required [disabled]="!!editing"></label>
          <label>Available quantity<input type="number" min="0" [(ngModel)]="form.availableQuantity" name="available" required></label>
          <label>Reorder level<input type="number" min="0" [(ngModel)]="form.reorderLevel" name="reorder" required></label>
          <label>Warehouse location<input [(ngModel)]="form.warehouseLocation" name="location"></label>
        </div>
        <div class="actions"><button class="primary" type="submit">Save inventory</button><button type="button" class="secondary" (click)="cancel()">Cancel</button></div>
      </form>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Source</th><th>SKU</th><th>Available</th><th>Reserved</th><th>Reorder</th><th>Status</th><th>Location</th><th>Actions</th></tr></thead><tbody>
        <tr *ngFor="let inv of inventory"><td>#{{inv.productId}} · {{productName(inv.productId)}}</td><td>{{inv.sourceCode}}</td><td>{{inv.sku}}</td><td>{{inv.availableQuantity}}</td><td>{{inv.reservedQuantity}}</td><td>{{inv.reorderLevel}}</td><td><span class="badge" [class.out]="inv.stockStatus==='OUT_OF_STOCK'" [class.low]="inv.stockStatus==='LOW_STOCK'">{{inv.stockStatus}}</span></td><td>{{inv.warehouseLocation||'—'}}</td><td><button class="edit" (click)="openEdit(inv)">Edit</button><button class="delete" (click)="remove(inv)">Delete</button></td></tr>
        <tr *ngIf="!inventory.length"><td colspan="9" class="empty">No inventory records.</td></tr>
      </tbody></table></div>
    </div>`,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.page-header h1{margin:0;color:#172033}.page-header p{color:#7a8492;margin:5px 0}.primary{background:#185c4a;color:#fff;border:0;border-radius:8px;padding:11px 17px;font-weight:800;cursor:pointer}.secondary,.edit,.delete{border:0;border-radius:7px;padding:8px 12px;cursor:pointer}.form-card,.table-wrap{background:#fff;border:1px solid #e3e8ec;border-radius:14px;padding:22px;margin-bottom:20px}.form-card h2{margin:0 0 17px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}label{font-size:.8rem;font-weight:700;color:#455162}input,select{width:100%;padding:10px;margin-top:6px;border:1px solid #dbe1e6;border-radius:8px;background:#fff}.actions{display:flex;gap:9px;margin-top:18px}.table-wrap{padding:0;overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:13px 15px;border-bottom:1px solid #edf0f2;font-size:.84rem}th{background:#f7f9fa;color:#667181}.badge{background:#e7f3ed;color:#18724b;border-radius:99px;padding:5px 8px;font-size:.68rem;font-weight:800}.badge.low{background:#fff1d5;color:#95600e}.badge.out{background:#fde6e3;color:#a83b2e}.edit{background:#e8f0ff;color:#2456a4;margin-right:5px}.delete{background:#fff0ed;color:#a83b2e}.empty{text-align:center;color:#8b94a0;padding:30px}@media(max-width:850px){.grid{grid-template-columns:1fr}.page-header{align-items:flex-start}}
  `]
})
export class AdminInventoryComponent implements OnInit {
  inventory:InventoryStatus[]=[];products:Product[]=[];showForm=false;editing?:InventoryStatus;form:any={};
  constructor(private inventoryService:InventoryService,private productService:ProductService,private toast:ToastService,private router:Router){}
  ngOnInit():void{this.load();this.productService.getProducts(0,100).subscribe(r=>this.products=r.data?.content||[])}
  load():void{this.inventoryService.getAll().subscribe({next:r=>this.inventory=r.data||[],error:()=>this.toast.error('Could not load inventory.')})}
  productName(id:number):string{return this.products.find(p=>p.id===id)?.name||'Unknown product'}
  openCreate():void{this.router.navigate(['/admin/inventory/new'])}
  openEdit(inv:InventoryStatus):void{this.router.navigate(['/admin/inventory',inv.id,'edit'])}
  selectProduct():void{const p=this.products.find(x=>x.id===this.form.productId);if(p)this.form.sku=p.sku}
  save():void{const op=this.editing?this.inventoryService.update(this.editing.productId,this.form):this.inventoryService.create(this.form);op.subscribe({next:()=>{this.toast.success(`Inventory ${this.editing?'updated':'created'}.`);this.cancel();this.load()},error:e=>this.toast.error(e.error?.message||'Could not save inventory.')})}
  remove(inv:InventoryStatus):void{if(!inv.id||!confirm(`Delete ${inv.sourceCode} inventory for ${inv.sku}?`))return;this.inventoryService.delete(inv.id).subscribe({next:()=>{this.toast.success('Inventory deleted.');this.load()},error:e=>this.toast.error(e.error?.message||'Could not delete inventory.')})}
  cancel():void{this.showForm=false;this.editing=undefined;this.form={}}
}
