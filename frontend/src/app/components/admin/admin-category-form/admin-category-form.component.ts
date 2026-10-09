import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Category } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';

@Component({selector:'app-admin-category-form',standalone:true,imports:[CommonModule,FormsModule,RouterLink],template:`
<div class="page"><a routerLink="/admin/categories">← Categories</a><h1>{{id?'Edit':'New'}} category</h1>
<form (ngSubmit)="save()"><label>Name<input [(ngModel)]="form.name" name="name" required></label><label>Description<textarea [(ngModel)]="form.description" name="description"></textarea></label>
<div><button type="submit">Save category</button><a routerLink="/admin/categories">Cancel</a></div></form></div>`,styles:[`.page{max-width:760px}h1{color:#172033}form{background:#fff;border:1px solid #e3e8ec;border-radius:14px;padding:24px;display:grid;gap:18px}label{font-weight:700;color:#455162}input,textarea{display:block;width:100%;margin-top:7px;padding:11px;border:1px solid #dbe1e6;border-radius:8px}textarea{min-height:120px}button{background:#185c4a;color:#fff;border:0;border-radius:8px;padding:11px 17px;font-weight:800;margin-right:14px}a{color:#687485}`]})
export class AdminCategoryFormComponent implements OnInit {
  id?:number; form:Partial<Category>={};
  constructor(private route:ActivatedRoute,private router:Router,private service:ProductService,private toast:ToastService){}
  ngOnInit():void{this.id=Number(this.route.snapshot.paramMap.get('id'))||undefined;if(this.id)this.service.getCategories().subscribe(r=>{const c=r.data?.find(x=>x.id===this.id);if(c)this.form={name:c.name,description:c.description}})}
  save():void{const request=this.id?this.service.updateCategory(this.id,this.form):this.service.createCategory(this.form);request.subscribe({next:()=>{this.toast.success(`Category ${this.id?'updated':'created'}.`);this.router.navigate(['/admin/categories'])},error:e=>this.toast.error(e.error?.message||'Could not save category.')})}
}
