import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../../models/product.model';
import { InventoryService, InventoryStatus } from '../../../services/inventory.service';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';

@Component({selector:'app-admin-inventory-form',standalone:true,imports:[CommonModule,FormsModule,RouterLink],template:`
<div class="page"><a routerLink="/admin/inventory">← Inventory</a><h1>{{id?'Edit':'New'}} inventory source</h1><form (ngSubmit)="save()"><div class="grid">
<label>Product<select [(ngModel)]="form.productId" name="product" required [disabled]="!!id" (change)="selectProduct()"><option [ngValue]="undefined">Select product</option><option *ngFor="let p of products" [ngValue]="p.id">{{p.name}} · {{p.sku}}</option></select></label>
<label>Source code<input [(ngModel)]="form.sourceCode" name="source" required [disabled]="!!id"></label><label>Available<input type="number" min="0" [(ngModel)]="form.availableQuantity" name="qty" required></label><label>Reorder level<input type="number" min="0" [(ngModel)]="form.reorderLevel" name="reorder" required></label><label>Warehouse<input [(ngModel)]="form.warehouseLocation" name="warehouse"></label></div>
<div><button type="submit">Save inventory</button><a routerLink="/admin/inventory">Cancel</a></div></form></div>`,styles:[`.page{max-width:900px}h1{color:#172033}form{background:#fff;border:1px solid #e3e8ec;border-radius:14px;padding:24px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-bottom:22px}label{font-weight:700;color:#455162}input,select{display:block;width:100%;margin-top:7px;padding:11px;border:1px solid #dbe1e6;border-radius:8px}button{background:#185c4a;color:white;border:0;border-radius:8px;padding:11px 17px;font-weight:800;margin-right:14px}a{color:#687485}@media(max-width:700px){.grid{grid-template-columns:1fr}}`]})
export class AdminInventoryFormComponent implements OnInit{
 id?:number;products:Product[]=[];form:Partial<InventoryStatus>={sourceCode:'',availableQuantity:0,reorderLevel:10};
 constructor(private route:ActivatedRoute,private router:Router,private inventory:InventoryService,private productService:ProductService,private toast:ToastService){}
 ngOnInit():void{this.id=Number(this.route.snapshot.paramMap.get('id'))||undefined;this.productService.getProducts(0,100).subscribe(r=>this.products=r.data?.content||[]);if(this.id)this.inventory.getAll().subscribe(r=>{const item=r.data?.find(x=>x.id===this.id);if(item)this.form={...item}})}
 selectProduct():void{const p=this.products.find(x=>x.id===this.form.productId);if(p)this.form.sku=p.sku}
 save():void{const request=this.id?this.inventory.update(this.id,this.form):this.inventory.create(this.form);request.subscribe({next:()=>{this.toast.success(`Inventory ${this.id?'updated':'created'}.`);this.router.navigate(['/admin/inventory'])},error:e=>this.toast.error(e.error?.message||'Could not save inventory.')})}
}
