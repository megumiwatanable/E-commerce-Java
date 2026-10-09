import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User, ApiResponse } from '../models/user.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = API_BASE_URL;
  private readonly currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.readSession());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/register`, request)
      .pipe(tap(response => this.persistSuccessfulLogin(response)));
  }

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, request)
      .pipe(tap(response => this.persistSuccessfulLogin(response)));
  }

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/me`);
  }

  updateProfile(data: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/users/me`, data);
  }

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/users`);
  }

  createUser(data: Partial<User> & { password?: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users`, data);
  }

  updateUser(id: number, data: Partial<User> & { password?: string }): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/users/${id}/admin`, data);
  }

  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/users/${id}`);
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(authResult));
    localStorage.setItem('token', authResult.token);
    this.currentUserSubject.next(authResult);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  private persistSuccessfulLogin(response: ApiResponse<AuthResponse>): void {
    if (response.success && response.data) {
      this.setSession(response.data);
    }
  }

  private readSession(): AuthResponse | null {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as AuthResponse;
    } catch {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      return null;
    }
  }
}
