import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/order.model';
import { API_BASE_URL } from '../config/api.config';

export interface InventoryStatus {
  productId: number;
  availableQuantity: number;
  reservedQuantity: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private http: HttpClient) {}
  getByProduct(productId: number): Observable<ApiResponse<InventoryStatus>> {
    return this.http.get<ApiResponse<InventoryStatus>>(`${API_BASE_URL}/inventory/${productId}`);
  }
}
