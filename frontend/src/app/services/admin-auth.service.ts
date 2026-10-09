import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse, LoginRequest } from '../models/user.model';

export interface AdminSession {
  token: string;
  type: string;
  adminId: number;
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly tokenStorageKey = 'adminToken';
  private readonly userStorageKey = 'adminUser';
  private readonly sessionSubject = new BehaviorSubject<AdminSession | null>(this.readSession());
  readonly session$ = this.sessionSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<ApiResponse<AdminSession>> {
    return this.http.post<ApiResponse<AdminSession>>(`${API_BASE_URL}/admin/auth/login`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          localStorage.setItem(this.tokenStorageKey, response.data.token);
          localStorage.setItem(this.userStorageKey, JSON.stringify(response.data));
          this.sessionSubject.next(response.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
    this.sessionSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private readSession(): AdminSession | null {
    const raw = localStorage.getItem(this.userStorageKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AdminSession;
    } catch {
      localStorage.removeItem(this.tokenStorageKey);
      localStorage.removeItem(this.userStorageKey);
      return null;
    }
  }
}
