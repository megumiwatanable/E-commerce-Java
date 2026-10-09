import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/order.model';
import { API_BASE_URL } from '../config/api.config';

export interface InventoryStatus {
  id?: number;
  productId: number;
  sku?: string;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel?: number;
  warehouseLocation?: string;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private http: HttpClient) {}
  getByProduct(productId: number): Observable<ApiResponse<InventoryStatus>> {
    return this.http.get<ApiResponse<InventoryStatus>>(`${API_BASE_URL}/inventory/${productId}`);
  }
  getAll(): Observable<ApiResponse<InventoryStatus[]>> {
    return this.http.get<ApiResponse<InventoryStatus[]>>(`${API_BASE_URL}/inventory`);
  }
  create(data: Partial<InventoryStatus>): Observable<ApiResponse<InventoryStatus>> {
    return this.http.post<ApiResponse<InventoryStatus>>(`${API_BASE_URL}/inventory`, data);
  }
  update(productId: number, data: Partial<InventoryStatus>): Observable<ApiResponse<InventoryStatus>> {
    return this.http.put<ApiResponse<InventoryStatus>>(`${API_BASE_URL}/inventory/${productId}`, data);
  }
  delete(productId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/inventory/${productId}`);
  }
}
