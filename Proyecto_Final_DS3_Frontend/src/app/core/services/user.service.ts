import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UpdateProfileRequest, UserProfile } from '../models/user.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private storage = inject(TokenStorageService);

  private readonly baseUrl = `${environment.apiUrl}/users`;

  /** GET /api/users/me */
  getMe(): Observable<UserProfile> {
    if (environment.useMock) {
      const u = this.storage.getUser();
      return of({
        id: 0,
        firstName: u?.firstName ?? '',
        lastName: u?.lastName ?? '',
        email: u?.email ?? '',
        role: u?.role ?? 'CLIENTE'
      });
    }
    return this.http.get<UserProfile>(`${this.baseUrl}/me`);
  }

  /** PUT /api/users/me (solo nombre y apellido; el correo y el rol no se editan aquí). */
  updateMe(request: UpdateProfileRequest): Observable<UserProfile> {
    if (environment.useMock) {
      const u = this.storage.getUser();
      if (u) {
        this.storage.save({ ...u, firstName: request.firstName, lastName: request.lastName });
      }
      return this.getMe();
    }
    return this.http.put<UserProfile>(`${this.baseUrl}/me`, request).pipe(
      tap(profile => {
        const u = this.storage.getUser();
        if (u) {
          this.storage.save({ ...u, firstName: profile.firstName, lastName: profile.lastName });
        }
      })
    );
  }
}
