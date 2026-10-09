import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, switchMap, map, forkJoin, catchError, throwError } from 'rxjs';
import { Cart, ApiResponse } from '../models/order.model';
import { Product } from '../models/product.model';
import { InventoryService } from './inventory.service';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly guestCartKey = 'guestCart';
  private apiUrl = `${API_BASE_URL}/cart`;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient, private inventoryService: InventoryService) {
    if (this.isGuest()) this.cartSubject.next(this.readGuestCart());
  }

  getCart(): Observable<ApiResponse<Cart>> {
    if (this.isGuest()) {
      const cart = this.readGuestCart();
      if (!cart.items.length) return of(this.success(cart));
      return forkJoin(cart.items.map(item => this.inventoryService.getByProduct(item.productId).pipe(
        map(response => {
          item.availableQuantity = response.data?.availableQuantity || 0;
          item.stockStatus = item.availableQuantity >= item.quantity ? 'IN_STOCK' : 'OUT_OF_STOCK';
          return item;
        }),
        catchError(() => { item.availableQuantity = 0; item.stockStatus = 'OUT_OF_STOCK'; return of(item); })
      ))).pipe(map(() => this.saveGuestCart(cart)));
    }
    return this.http.get<ApiResponse<Cart>>(this.apiUrl)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.cartSubject.next(response.data);
          }
        })
      );
  }

  addToCart(product: Product, quantity: number): Observable<ApiResponse<Cart>> {
    return this.inventoryService.getByProduct(product.id).pipe(switchMap(stock => {
      const available = stock.data?.availableQuantity || 0;
      const currentQuantity = this.cartSubject.value?.items.find(item => item.productId === product.id)?.quantity || 0;
      if (!stock.success || available < currentQuantity + quantity) {
        return throwError(() => ({ error: { message: available > 0 ? `Only ${available} item(s) are available.` : 'This product is out of stock.' } }));
      }
      if (this.isGuest()) {
      const cart = this.readGuestCart();
      const existing = cart.items.find(item => item.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = existing.quantity * existing.unitPrice;
      } else {
        cart.items.push({
          id: product.id,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitPrice: product.finalPrice,
          subtotal: product.finalPrice * quantity,
          imageUrl: product.imageUrl,
          availableQuantity: available,
          stockStatus: 'IN_STOCK'
        });
      }
      return of(this.saveGuestCart(cart));
      }
      return this.http.post<ApiResponse<Cart>>(`${this.apiUrl}/items`, { productId: product.id, quantity })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.cartSubject.next(response.data);
          }
        })
      );
    }));
  }

  updateQuantity(productId: number, quantity: number): Observable<ApiResponse<Cart>> {
    if (this.isGuest()) {
      return this.inventoryService.getByProduct(productId).pipe(switchMap(stock => {
        const available = stock.data?.availableQuantity || 0;
        if (available < quantity) return throwError(() => ({ error: { message: available > 0 ? `Only ${available} item(s) are available.` : 'This product is out of stock.' } }));
        const cart = this.readGuestCart();
        const item = cart.items.find(value => value.productId === productId);
        if (item) { item.quantity = quantity; item.subtotal = item.unitPrice * quantity; item.availableQuantity = available; item.stockStatus = 'IN_STOCK'; }
        return of(this.saveGuestCart(cart));
      }));
    }
    return this.http.put<ApiResponse<Cart>>(`${this.apiUrl}/items/${productId}`, { quantity })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.cartSubject.next(response.data);
          }
        })
      );
  }

  removeItem(productId: number): Observable<ApiResponse<void>> {
    if (this.isGuest()) {
      const cart = this.readGuestCart();
      cart.items = cart.items.filter(item => item.productId !== productId);
      this.saveGuestCart(cart);
      return of(this.success<void>(undefined));
    }
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/items/${productId}`)
      .pipe(
        tap(() => this.getCart().subscribe())
      );
  }

  clearCart(): Observable<ApiResponse<void>> {
    if (this.isGuest()) {
      localStorage.removeItem(this.guestCartKey);
      this.cartSubject.next(this.emptyGuestCart());
      return of(this.success<void>(undefined));
    }
    return this.http.delete<ApiResponse<void>>(this.apiUrl)
      .pipe(
        tap(() => this.cartSubject.next(null))
      );
  }

  setBillingAddress(billingAddress: string): Observable<ApiResponse<Cart>> {
    if (this.isGuest()) {
      const cart = this.readGuestCart();
      cart.billingAddress = billingAddress;
      return of(this.saveGuestCart(cart));
    }
    return this.http.put<ApiResponse<Cart>>(`${this.apiUrl}/billing-address`, { billingAddress }).pipe(
      tap(response => { if (response.data) this.cartSubject.next(response.data); })
    );
  }

  getCartItemCount(): number {
    return this.cartSubject.value?.totalItems || 0;
  }

  private isGuest(): boolean {
    return !localStorage.getItem('token');
  }

  private emptyGuestCart(): Cart {
    return { id: 0, customerId: 0, items: [], subtotal: 0, totalItems: 0 };
  }

  private readGuestCart(): Cart {
    const raw = localStorage.getItem(this.guestCartKey);
    return raw ? JSON.parse(raw) : this.emptyGuestCart();
  }

  private saveGuestCart(cart: Cart): ApiResponse<Cart> {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem(this.guestCartKey, JSON.stringify(cart));
    this.cartSubject.next(cart);
    return this.success(cart);
  }

  private success<T>(data: T): ApiResponse<T> {
    return { success: true, message: 'OK', data, timestamp: new Date().toISOString() };
  }
}
