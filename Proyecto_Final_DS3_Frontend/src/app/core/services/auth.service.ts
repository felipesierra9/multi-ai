import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, delay, of, switchMap, tap, throwError, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse, ForgotPasswordRequest, LoginRequest, MessageResponse,
  RegisterRequest, ResetPasswordRequest, Role
} from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

/** Mensaje único: nunca revela si un correo está registrado. */
export const FORGOT_PASSWORD_MESSAGE =
  'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.';

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

  /** GET /api/auth/verify-email?token=... */
  verifyEmail(token: string): Observable<MessageResponse> {
    if (environment.useMock) {
      return this.mockToken(token, 'Correo verificado. Ya puedes iniciar sesión.');
    }
    return this.http.get<MessageResponse>(`${this.baseUrl}/verify-email`, { params: { token } });
  }

  /** POST /api/auth/forgot-password */
  forgotPassword(request: ForgotPasswordRequest): Observable<MessageResponse> {
    if (environment.useMock) {
      return of({ message: FORGOT_PASSWORD_MESSAGE }).pipe(delay(600));
    }
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password`, request);
  }

  /** POST /api/auth/reset-password */
  resetPassword(request: ResetPasswordRequest): Observable<MessageResponse> {
    if (environment.useMock) {
      return this.mockToken(request.token, 'Contraseña actualizada. Ya puedes iniciar sesión.');
    }
    return this.http.post<MessageResponse>(`${this.baseUrl}/reset-password`, request);
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

  /** MODO SIMULADO: solo estos tokens de prueba existen. No es un token real. */
  private mockToken(token: string, okMessage: string): Observable<MessageResponse> {
    if (token === 'demo-valido') {
      return of({ message: okMessage }).pipe(delay(600));
    }
    const errors: Record<string, string> = {
      'demo-usado': 'Este enlace ya fue utilizado.',
      'demo-vencido': 'Este enlace venció. Solicita uno nuevo.'
    };
    return timer(600).pipe(
      switchMap(() => throwError(() => ({
        status: 400,
        error: { message: errors[token] ?? 'Enlace inválido.' }
      })))
    );
  }
}
