import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { Cart } from '../../../models/order.model';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-cart', standalone: true, imports: [CommonModule, RouterModule],
  template: `
    <main class="cart-page">
      <header><div><span class="eyebrow">YOUR BAG</span><h1>Shopping cart</h1><p *ngIf="cart?.totalItems">{{cart?.totalItems}} item{{cart?.totalItems === 1 ? '' : 's'}} ready for checkout</p></div><a routerLink="/products">Continue shopping →</a></header>
      <div *ngIf="loading" class="state-card">Loading your cart…</div>
      <div *ngIf="!loading && (!cart || !cart.items.length)" class="state-card empty"><div>Bag</div><h2>Your bag is waiting</h2><p>Explore the catalog and add your first item.</p><a routerLink="/products" class="primary">Explore products</a></div>
      <div *ngIf="cart?.items?.length" class="cart-layout">
        <section class="items-panel">
          <div *ngFor="let item of cart?.items" class="cart-item">
            <a [routerLink]="['/products', item.productId]" class="product-image"><img [src]="item.imageUrl || 'https://placehold.co/180x180/f1f3f5/53606f?text=Item'" [alt]="item.productName"></a>
            <div class="product-copy"><span class="sku">{{item.sku}}</span><a [routerLink]="['/products', item.productId]" class="name">{{item.productName}}</a><span class="stock" [class.out]="item.stockStatus === 'OUT_OF_STOCK'">{{item.stockStatus === 'OUT_OF_STOCK' ? 'Out of stock' : 'In stock'}}<small *ngIf="item.stockStatus !== 'OUT_OF_STOCK' && item.availableQuantity != null"> · {{item.availableQuantity}} available</small></span><span class="unit-price">{{money(item.unitPrice)}} each</span><button (click)="removeItem(item.productId)">Remove</button></div>
            <div class="quantity"><button [disabled]="busyId===item.productId || item.quantity<=1" (click)="updateQuantity(item.productId,item.quantity-1)" aria-label="Decrease quantity">−</button><span>{{item.quantity}}</span><button [disabled]="busyId===item.productId || item.stockStatus === 'OUT_OF_STOCK' || (item.availableQuantity != null && item.quantity >= item.availableQuantity)" (click)="updateQuantity(item.productId,item.quantity+1)" aria-label="Increase quantity">+</button></div>
            <strong class="line-total">{{money(item.subtotal)}}</strong>
          </div>
          <div class="shipping-note"><span>✓</span><div><strong>{{shipping === 0 ? 'You unlocked free shipping' : money(100-(cart?.subtotal||0))+' away from free shipping'}}</strong><div class="progress"><i [style.width.%]="shippingProgress"></i></div></div></div>
        </section>
        <aside class="summary">
          <h2>Summary</h2><div><span>Subtotal</span><b>{{money(cart?.subtotal||0)}}</b></div><div><span>Shipping</span><b [class.free]="shipping===0">{{shipping===0?'Free':money(shipping)}}</b></div><div><span>Estimated tax</span><b>{{money(tax)}}</b></div><div class="total"><span>Total</span><b>{{money(total)}}</b></div>
          <a *ngIf="!hasOutOfStock" routerLink="/checkout" class="checkout">Checkout securely</a><span *ngIf="hasOutOfStock" class="checkout disabled">Resolve stock issues to checkout</span><p>Guest checkout available · No account required</p>
          <ul><li>✓ Inventory checked at order placement</li><li>✓ Secure payment processing</li><li>✓ Clear order confirmation</li></ul>
        </aside>
      </div>
    </main>
  `,
  styles: [`
    .cart-page{max-width:1180px;margin:0 auto;padding:40px 24px 75px}header{display:flex;justify-content:space-between;align-items:end;margin-bottom:28px}header h1{font-size:2.2rem;letter-spacing:-.04em;color:#111827;margin:3px 0}header p{color:#7a8492}header>a{color:#185c4a;font-weight:700;font-size:.9rem}.eyebrow{color:#185c4a;font-size:.72rem;font-weight:800;letter-spacing:.16em}.cart-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:28px;align-items:start}.items-panel,.summary,.state-card{background:#fff;border:1px solid #e4e8ed;border-radius:18px;box-shadow:0 10px 30px rgba(20,31,50,.04)}.items-panel{padding:4px 24px}.cart-item{display:grid;grid-template-columns:110px minmax(0,1fr) auto 90px;gap:20px;align-items:center;padding:22px 0;border-bottom:1px solid #edf0f3}.product-image{background:#f5f6f7;border-radius:13px;overflow:hidden}.product-image img{display:block;width:110px;height:110px;object-fit:cover}.product-copy{display:flex;flex-direction:column;align-items:flex-start}.sku{font-size:.7rem;color:#929aa5;letter-spacing:.08em}.name{font-size:1rem;font-weight:800;color:#202a39;margin:5px 0}.name:hover{color:#185c4a}.unit-price{font-size:.8rem;color:#7e8794}.product-copy button{border:0;background:none;color:#9a4b43;padding:10px 0 0;cursor:pointer;font-size:.76rem}.quantity{display:flex;border:1px solid #dce1e6;border-radius:9px;overflow:hidden}.quantity button,.quantity span{width:34px;height:36px;display:grid;place-items:center;border:0;background:#fff}.quantity button{cursor:pointer;font-size:1.05rem}.quantity button:hover:not(:disabled){background:#f0f5f3;color:#185c4a}.quantity button:disabled{opacity:.35}.quantity span{font-weight:800;font-size:.85rem}.line-total{text-align:right;color:#172033}.shipping-note{display:flex;align-items:center;gap:12px;padding:18px 0;color:#315949}.shipping-note>span{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:#e8f3ee}.shipping-note>div{flex:1;font-size:.82rem}.progress{height:5px;background:#e7ecea;border-radius:3px;margin-top:7px;overflow:hidden}.progress i{display:block;height:100%;background:#2e846a}.summary{padding:25px;position:sticky;top:86px}.summary h2{font-size:1.1rem;margin-bottom:19px}.summary>div{display:flex;justify-content:space-between;color:#687383;font-size:.88rem;margin:11px 0}.summary b{color:#2d3746}.summary .free{color:#18724b}.summary .total{border-top:1px solid #e7eaee;margin-top:17px;padding-top:17px;font-size:1.1rem;color:#16202f}.summary .total b{font-size:1.25rem}.checkout,.primary{display:block;text-align:center;background:#185c4a;color:#fff;border-radius:10px;padding:14px 18px;font-weight:800;margin-top:20px}.checkout:hover,.primary:hover{background:#114b3d;transform:translateY(-1px)}.summary>p{text-align:center;color:#929aa5;font-size:.72rem;margin:10px 0 18px}.summary ul{list-style:none;border-top:1px solid #edf0f3;padding-top:14px;color:#75808e;font-size:.76rem}.summary li{margin:7px 0}.state-card{text-align:center;padding:70px 20px}.state-card.empty>div{width:62px;height:62px;display:grid;place-items:center;margin:0 auto 16px;border-radius:50%;background:#edf4f1;color:#185c4a;font-weight:800}.state-card h2{margin-bottom:6px}.state-card p{color:#7c8694}.state-card .primary{display:inline-block;margin-top:22px}@media(max-width:850px){.cart-layout{grid-template-columns:1fr}.summary{position:static}.cart-item{grid-template-columns:82px 1fr auto}.product-image img{width:82px;height:82px}.line-total{grid-column:2;text-align:left}.quantity{grid-row:1/3;grid-column:3}}@media(max-width:560px){.cart-page{padding:26px 14px 55px}header{align-items:start}header h1{font-size:1.8rem}header>a{display:none}.items-panel{padding:0 15px}.cart-item{gap:12px}.summary{padding:21px}}
  `, `
    .stock{font-size:.73rem;font-weight:800;color:#18724b;margin:1px 0 5px}.stock.out{color:#b34135}.stock small{font-weight:600}.checkout.disabled{background:#aeb6b2;cursor:not-allowed}.checkout.disabled:hover{transform:none;background:#aeb6b2}
  `]
})
export class CartComponent implements OnInit {
  cart:Cart|null=null; loading=true; busyId?:number;
  constructor(private cartService:CartService,private toast:ToastService){}
  ngOnInit():void{this.cartService.cart$.subscribe(c=>this.cart=c);this.cartService.getCart().subscribe({next:()=>this.loading=false,error:()=>this.loading=false})}
  get shipping():number{return (this.cart?.subtotal||0)>=100?0:9.99} get tax():number{return Math.round((this.cart?.subtotal||0)*18)/100} get total():number{return (this.cart?.subtotal||0)+this.shipping+this.tax} get shippingProgress():number{return Math.min(100,(this.cart?.subtotal||0))}
  get hasOutOfStock():boolean{return !!this.cart?.items.some(i=>i.stockStatus==='OUT_OF_STOCK'||(i.availableQuantity!=null&&i.quantity>i.availableQuantity))}
  money(v:number):string{return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v)}
  updateQuantity(id:number,q:number):void{if(q<1)return;this.busyId=id;this.cartService.updateQuantity(id,q).subscribe({next:()=>this.busyId=undefined,error:e=>{this.busyId=undefined;this.toast.error(e.error?.message||'Could not update quantity.')}})}
  removeItem(id:number):void{this.busyId=id;this.cartService.removeItem(id).subscribe({next:()=>{this.busyId=undefined;this.toast.success('Item removed from cart.')},error:()=>{this.busyId=undefined;this.toast.error('Could not remove item.')}})}
}
