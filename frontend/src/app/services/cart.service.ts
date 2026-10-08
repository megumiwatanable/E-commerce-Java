import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Cart, ApiResponse } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:8090/api/cart';
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart(): Observable<ApiResponse<Cart>> {
    return this.http.get<ApiResponse<Cart>>(this.apiUrl)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.cartSubject.next(response.data);
          }
        })
      );
  }

  addToCart(productId: number, quantity: number): Observable<ApiResponse<Cart>> {
    return this.http.post<ApiResponse<Cart>>(`${this.apiUrl}/items`, { productId, quantity })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.cartSubject.next(response.data);
          }
        })
      );
  }

  updateQuantity(productId: number, quantity: number): Observable<ApiResponse<Cart>> {
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
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/items/${productId}`)
      .pipe(
        tap(() => this.getCart().subscribe())
      );
  }

  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(this.apiUrl)
      .pipe(
        tap(() => this.cartSubject.next(null))
      );
  }

  getCartItemCount(): number {
    return this.cartSubject.value?.totalItems || 0;
  }
}
