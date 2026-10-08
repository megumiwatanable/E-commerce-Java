import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderItem, ApiResponse, PageResponse, PlaceOrderRequest, PlaceOrderResult } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:8090/api/orders';

  constructor(private http: HttpClient) {}

  createOrder(shippingAddress: string, items: { productId: number; quantity: number }[], guestEmail?: string, guestPhone?: string): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.apiUrl, { shippingAddress, items, guestEmail, guestPhone });
  }

  placeOrder(request: PlaceOrderRequest): Observable<ApiResponse<PlaceOrderResult>> {
    return this.http.post<ApiResponse<PlaceOrderResult>>('http://localhost:8090/api/checkout/place-order', request);
  }

  getOrderById(id: number): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${id}`);
  }

  getOrderByNumber(orderNumber: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/number/${orderNumber}`);
  }

  getCustomerOrders(customerId: number, page = 0, size = 10): Observable<ApiResponse<PageResponse<Order>>> {
    return this.http.get<ApiResponse<PageResponse<Order>>>(`${this.apiUrl}/customer/${customerId}?page=${page}&size=${size}`);
  }

  getAllOrders(page = 0, size = 10, status?: string): Observable<ApiResponse<PageResponse<Order>>> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    return this.http.get<ApiResponse<PageResponse<Order>>>(url);
  }

  getOrderItems(orderId: number): Observable<ApiResponse<OrderItem[]>> {
    return this.http.get<ApiResponse<OrderItem[]>>(`${this.apiUrl}/${orderId}/items`);
  }

  cancelOrder(orderId: number): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/cancel`, {});
  }

  updateOrderStatus(orderId: number, status: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/status`, { orderStatus: status });
  }

  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`);
  }
}
