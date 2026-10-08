import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { Cart, Order, PlaceOrderRequest } from '../../../models/order.model';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-checkout', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="checkout-shell">
      <header class="checkout-header">
        <a routerLink="/cart" class="back-link">← Back to cart</a>
        <div><span class="eyebrow">SECURE CHECKOUT</span><h1>Complete your order</h1><p>Delivery, payment, and final review in one place.</p></div>
        <div class="secure-pill">⌁ Secure payment</div>
      </header>

      <div *ngIf="loadingCart" class="state-card">Loading your cart…</div>
      <div *ngIf="!loadingCart && (!cart || !cart.items.length) && !completedOrder" class="state-card empty">
        <div class="empty-icon">Bag</div><h2>Your cart is empty</h2><p>Add something you like before opening checkout.</p>
        <a routerLink="/products" class="primary-button auto">Browse products</a>
      </div>

      <form *ngIf="cart?.items?.length && !completedOrder" #checkoutForm="ngForm" (ngSubmit)="submit(checkoutForm)" class="checkout-grid">
        <div class="checkout-main">
          <section class="panel">
            <div class="panel-heading"><span class="section-number">1</span><div><h2>Contact</h2><p>We will send order updates here.</p></div></div>
            <div class="field-grid two">
              <label>Email address<input type="email" name="email" [(ngModel)]="form.email" required email autocomplete="email" placeholder="you@example.com"></label>
              <label>Phone number<input type="tel" name="phone" [(ngModel)]="form.phone" required pattern="[0-9+() -]{8,30}" autocomplete="tel" placeholder="090 123 4567"></label>
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading"><span class="section-number">2</span><div><h2>Shipping address</h2><p>Used for delivery and your order record.</p></div></div>
            <div class="field-grid two">
              <label>First name<input name="firstName" [(ngModel)]="form.firstName" required autocomplete="given-name"></label>
              <label>Last name<input name="lastName" [(ngModel)]="form.lastName" required autocomplete="family-name"></label>
            </div>
            <label>Street address<input name="street" [(ngModel)]="form.street" required autocomplete="street-address" placeholder="House number and street"></label>
            <div class="field-grid two">
              <label>City<input name="city" [(ngModel)]="form.city" required autocomplete="address-level2"></label>
              <label>State / Province<input name="state" [(ngModel)]="form.state" required autocomplete="address-level1"></label>
            </div>
            <div class="field-grid two">
              <label>Postal code<input name="postalCode" [(ngModel)]="form.postalCode" required autocomplete="postal-code"></label>
              <label>Country<input name="country" [(ngModel)]="form.country" required autocomplete="country-name"></label>
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading"><span class="section-number">3</span><div><h2>Billing address</h2><p>Saved with both your cart and order.</p></div></div>
            <label class="same-address"><input type="checkbox" name="billingSame" [(ngModel)]="billingSame"><span>Use shipping address for billing</span></label>
            <ng-container *ngIf="!billingSame">
              <div class="field-grid two"><label>First name<input name="billingFirstName" [(ngModel)]="billing.firstName" required></label><label>Last name<input name="billingLastName" [(ngModel)]="billing.lastName" required></label></div>
              <label>Street address<input name="billingStreet" [(ngModel)]="billing.street" required></label>
              <div class="field-grid two"><label>City<input name="billingCity" [(ngModel)]="billing.city" required></label><label>State / Province<input name="billingState" [(ngModel)]="billing.state" required></label></div>
              <div class="field-grid two"><label>Postal code<input name="billingPostalCode" [(ngModel)]="billing.postalCode" required></label><label>Country<input name="billingCountry" [(ngModel)]="billing.country" required></label></div>
            </ng-container>
          </section>

          <section class="panel">
            <div class="panel-heading"><span class="section-number">4</span><div><h2>Payment</h2><p>Your order is placed only after payment is accepted.</p></div></div>
            <div class="payment-list">
              <label *ngFor="let method of paymentMethods" class="payment-option" [class.selected]="form.paymentMethod === method.value">
                <input type="radio" name="paymentMethod" [(ngModel)]="form.paymentMethod" [value]="method.value" required>
                <span class="payment-icon">{{method.icon}}</span><span class="payment-copy"><strong>{{method.name}}</strong><small>{{method.description}}</small></span><span class="radio-mark"></span>
              </label>
            </div>
          </section>
          <div *ngIf="errorMessage" class="error-box"><strong>We couldn't place the order.</strong><span>{{errorMessage}}</span></div>
        </div>

        <aside class="summary-card">
          <h2>Order summary</h2>
          <div class="summary-items">
            <div *ngFor="let item of cart?.items" class="summary-item">
              <div class="thumb-wrap"><img [src]="item.imageUrl || 'https://placehold.co/96x96/f1f3f5/53606f?text=Item'" [alt]="item.productName"><span>{{item.quantity}}</span></div>
              <div><strong>{{item.productName}}</strong><small>{{item.sku}}</small><small class="stock-state" [class.out]="item.stockStatus === 'OUT_OF_STOCK'">{{item.stockStatus === 'OUT_OF_STOCK' ? 'Out of stock' : 'In stock'}}</small></div><b>{{money(item.subtotal)}}</b>
            </div>
          </div>
          <div class="totals">
            <div><span>Subtotal</span><span>{{money(cart?.subtotal || 0)}}</span></div>
            <div><span>Shipping</span><span [class.free]="shipping === 0">{{shipping === 0 ? 'Free' : money(shipping)}}</span></div>
            <div><span>Tax</span><span>{{money(tax)}}</span></div>
            <div class="grand-total"><span>Total</span><span>{{money(total)}}</span></div>
          </div>
          <button class="place-order" type="submit" [disabled]="submitting || hasOutOfStock"><span *ngIf="!submitting">{{hasOutOfStock ? 'Resolve stock issues' : 'Place order · '+money(total)}}</span><span *ngIf="submitting" class="button-loading"><i></i> Placing order…</span></button>
          <p class="terms">By placing your order, you agree to our terms and returns policy.</p>
        </aside>
      </form>

      <div *ngIf="completedOrder" class="success-view">
        <div class="success-check">✓</div><span class="eyebrow">ORDER CONFIRMED</span><h1>Thanks, {{form.firstName}}.</h1>
        <p>Your order <strong>{{completedOrder.orderNumber}}</strong> is now being processed.</p>
        <div class="success-meta"><div><span>Total</span><strong>{{money(completedOrder.finalAmount)}}</strong></div><div><span>Contact</span><strong>{{form.email}}</strong></div><div><span>Delivery</span><strong>{{form.city}}, {{form.country}}</strong></div></div>
        <div class="success-actions"><a *ngIf="completedOrder.customerId" [routerLink]="['/order', completedOrder.id]" class="primary-button auto">View order</a><a routerLink="/products" class="secondary-button">Continue shopping</a></div>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block}.checkout-shell{max-width:1180px;margin:0 auto;padding:38px 24px 72px}.checkout-header{display:grid;grid-template-columns:150px 1fr auto;gap:28px;align-items:start;margin-bottom:30px}.back-link{color:#647083;font-size:.9rem;padding-top:8px}.back-link:hover{color:#185c4a}.eyebrow{color:#185c4a;font-size:.72rem;font-weight:800;letter-spacing:.16em}h1{margin:5px 0 4px;font-size:2.15rem;line-height:1.15;letter-spacing:-.035em;color:#111827}.checkout-header p{color:#687385}.secure-pill{background:#eaf4f0;color:#185c4a;border:1px solid #d4e8e0;padding:9px 13px;border-radius:999px;font-size:.82rem;font-weight:700}.checkout-grid{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:28px;align-items:start}.checkout-main{display:grid;gap:18px}.panel,.summary-card,.state-card,.success-view{background:#fff;border:1px solid #e5e9ef;border-radius:18px;box-shadow:0 10px 30px rgba(20,31,50,.045)}.panel{padding:25px}.panel-heading{display:flex;gap:13px;align-items:flex-start;margin-bottom:22px}.panel-heading h2,.summary-card h2{font-size:1.08rem;margin:0 0 2px;color:#182131}.panel-heading p{color:#7a8494;font-size:.86rem}.section-number{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:#185c4a;color:#fff;font-size:.82rem;font-weight:800;flex:none}.field-grid{display:grid;gap:15px}.field-grid.two{grid-template-columns:1fr 1fr}label{display:block;color:#3b4657;font-size:.82rem;font-weight:700;margin-bottom:15px}input:not([type=radio]){width:100%;margin-top:7px;padding:12px 13px;border:1px solid #dce1e8;border-radius:9px;font:inherit;font-weight:500;color:#172033;background:#fff}input:not([type=radio]):focus{outline:none;border-color:#2a7763;box-shadow:0 0 0 3px rgba(24,92,74,.1)}.payment-list{display:grid;gap:10px}.payment-option{display:flex;align-items:center;gap:13px;padding:15px;margin:0;border:1px solid #dfe4ea;border-radius:12px;cursor:pointer}.payment-option.selected{border-color:#2a7763;background:#f5faf8;box-shadow:0 0 0 1px #2a7763}.payment-option input{position:absolute;opacity:0}.payment-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:9px;background:#f0f2f5;font-size:1.1rem}.payment-copy{flex:1;display:flex;flex-direction:column}.payment-copy strong{color:#222c3b}.payment-copy small{color:#7b8594;font-weight:500;margin-top:2px}.radio-mark{width:18px;height:18px;border:2px solid #b8c0cb;border-radius:50%;position:relative}.selected .radio-mark{border-color:#185c4a}.selected .radio-mark:after{content:'';position:absolute;inset:3px;background:#185c4a;border-radius:50%}.summary-card{padding:24px;position:sticky;top:86px}.summary-items{max-height:280px;overflow:auto;margin:18px 0}.summary-item{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:10px 0}.thumb-wrap{position:relative}.thumb-wrap img{width:54px;height:54px;object-fit:cover;border-radius:10px;border:1px solid #edf0f3}.thumb-wrap span{position:absolute;right:-5px;top:-6px;min-width:19px;height:19px;display:grid;place-items:center;border-radius:10px;background:#344153;color:#fff;font-size:.68rem}.summary-item strong{display:block;color:#263142;font-size:.82rem;line-height:1.25}.summary-item small{color:#9098a4;font-size:.72rem}.summary-item b{font-size:.82rem}.totals{border-top:1px solid #edf0f3;padding-top:13px}.totals>div{display:flex;justify-content:space-between;margin:9px 0;color:#657082;font-size:.9rem}.free{color:#197149;font-weight:700}.totals .grand-total{color:#172033;font-size:1.12rem;font-weight:800;border-top:1px solid #edf0f3;padding-top:14px;margin-top:14px}.place-order,.primary-button{width:100%;border:0;border-radius:10px;background:#185c4a;color:white;padding:14px 18px;font-weight:800;cursor:pointer;text-align:center;display:inline-block}.place-order:hover,.primary-button:hover{background:#114b3d;transform:translateY(-1px)}.place-order:disabled{opacity:.65;cursor:wait;transform:none}.terms{color:#929aa6;text-align:center;font-size:.72rem;margin:11px 12px 0;line-height:1.45}.button-loading{display:flex;justify-content:center;align-items:center;gap:8px}.button-loading i{width:15px;height:15px;border:2px solid rgba(255,255,255,.45);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.error-box{display:flex;flex-direction:column;background:#fff4f2;border:1px solid #ffd8d1;color:#a83b2e;border-radius:12px;padding:14px 16px;font-size:.86rem}.error-box span{margin-top:2px}.state-card,.success-view{padding:60px;text-align:center}.empty-icon{width:60px;height:60px;display:grid;place-items:center;margin:0 auto 16px;background:#eff3f2;color:#185c4a;border-radius:50%;font-weight:800}.empty p{color:#788292;margin:7px 0 22px}.auto{width:auto}.success-view{max-width:720px;margin:35px auto}.success-check{width:68px;height:68px;display:grid;place-items:center;margin:0 auto 19px;border-radius:50%;background:#185c4a;color:#fff;font-size:1.8rem}.success-view>p{color:#6e7888;margin-top:10px}.success-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}.success-meta div{background:#f7f9fa;padding:15px;border-radius:11px;display:flex;flex-direction:column}.success-meta span{color:#8a93a0;font-size:.74rem}.success-meta strong{margin-top:4px;font-size:.86rem;word-break:break-word}.success-actions{display:flex;gap:10px;justify-content:center}.secondary-button{border:1px solid #dce2e8;padding:13px 18px;border-radius:10px;font-weight:800;color:#354052}@media(max-width:900px){.checkout-header{grid-template-columns:1fr}.secure-pill{display:none}.checkout-grid{grid-template-columns:1fr}.summary-card{position:static}.back-link{order:2}.success-meta{grid-template-columns:1fr}}@media(max-width:600px){.checkout-shell{padding:24px 14px 50px}.field-grid.two{grid-template-columns:1fr;gap:0}.panel,.summary-card{padding:19px}.checkout-header h1{font-size:1.75rem}.state-card,.success-view{padding:38px 20px}}
  `, `
    .same-address{display:flex;align-items:center;gap:10px;background:#f4f8f6;padding:13px;border-radius:10px;cursor:pointer}
    .same-address input{width:17px!important;height:17px;margin:0!important;padding:0!important;accent-color:#185c4a}
    .same-address span{font-size:.86rem}
    .stock-state{display:block;color:#18724b;font-weight:800;margin-top:3px}.stock-state.out{color:#b34135}
  `]
})
export class CheckoutComponent implements OnInit {
  cart: Cart | null = null; loadingCart = true; submitting = false; errorMessage = ''; completedOrder?: Order;
  form = { email:'', phone:'', firstName:'', lastName:'', street:'', city:'', state:'', postalCode:'', country:'Vietnam', paymentMethod:'CASH_ON_DELIVERY' };
  billingSame = true;
  billing = { firstName:'', lastName:'', street:'', city:'', state:'', postalCode:'', country:'Vietnam' };
  paymentMethods = [{value:'CASH_ON_DELIVERY',name:'Cash on delivery',description:'Pay when your order arrives',icon:'◫'},{value:'CARD',name:'Card — local demo',description:'Simulated approval; no real charge is made',icon:'▣'},{value:'UPI',name:'Mobile payment — local demo',description:'Simulated approval for development',icon:'◇'}];
  constructor(private cartService: CartService, private orderService: OrderService) {}
  ngOnInit(): void { this.cartService.getCart().subscribe({next:r=>{this.cart=r.data||null;this.loadingCart=false},error:()=>{this.loadingCart=false;this.errorMessage='Could not load your cart.'}}); }
  get shipping():number{return (this.cart?.subtotal||0)>=100?0:9.99} get tax():number{return Math.round((this.cart?.subtotal||0)*18)/100} get total():number{return (this.cart?.subtotal||0)+this.shipping+this.tax}
  get hasOutOfStock():boolean{return !!this.cart?.items.some(i=>i.stockStatus==='OUT_OF_STOCK'||(i.availableQuantity!=null&&i.quantity>i.availableQuantity))}
  money(value:number):string{return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value)}
  submit(f:NgForm):void {
    if(f.invalid){f.form.markAllAsTouched();this.errorMessage='Please complete all required fields.';return} if(this.hasOutOfStock){this.errorMessage='One or more products are out of stock. Please review your cart.';return} if(!this.cart?.items.length||this.submitting)return;
    this.submitting=true;this.errorMessage='';const keyName='checkout_idempotency_key';const key=sessionStorage.getItem(keyName)||this.newId();sessionStorage.setItem(keyName,key);
    const shipping={firstName:this.form.firstName,lastName:this.form.lastName,street:this.form.street,city:this.form.city,state:this.form.state,postalCode:this.form.postalCode,country:this.form.country};
    const billing=this.billingSame?shipping:{...this.billing};
    const request:PlaceOrderRequest={idempotencyKey:key,email:this.form.email,phone:this.form.phone,paymentMethod:this.form.paymentMethod,shippingAddress:shipping,billingAddress:billing,items:this.cart.items.map(i=>({productId:i.productId,quantity:i.quantity}))};
    const billingText=`${billing.firstName} ${billing.lastName}, ${billing.street}, ${billing.city}, ${billing.state} ${billing.postalCode}, ${billing.country}`;
    this.cartService.setBillingAddress(billingText).pipe(switchMap(()=>this.orderService.placeOrder(request))).subscribe({next:r=>{this.submitting=false;if(!r.success||!r.data?.order){this.errorMessage=r.message||'Could not place order.';return}this.completedOrder=r.data.order;sessionStorage.removeItem(keyName);window.scrollTo({top:0,behavior:'smooth'})},error:e=>{this.submitting=false;sessionStorage.removeItem(keyName);this.errorMessage=e.error?.message||'Payment or inventory validation failed. Please review your cart and try again.'}});
  }
  private newId():string{return globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2)}
}
