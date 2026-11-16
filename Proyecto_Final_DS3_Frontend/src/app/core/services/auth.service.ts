import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, MessageResponse, RegisterRequest, Role } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(TokenStorageService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, request)
      .pipe(tap(res => this.storage.save(res)));
  }

  register(request: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/register`, request);
  }

  logout(): void {
    this.storage.clear();
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return this.storage.isTokenValid();
  }

  getUser(): AuthResponse | null {
    return this.storage.getUser();
  }

  hasRole(role: Role): boolean {
    return this.isLoggedIn() && this.storage.getUser()?.role === role;
  }
}
