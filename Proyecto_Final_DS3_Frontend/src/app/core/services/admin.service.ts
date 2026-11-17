import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminStatistics, AdminUser, AuditEntry, AuditFilters, CreateUserRequest,
  ReportFile, ReportFormat, ReportType, StatisticsFilters, UpdateUserRequest
} from '../models/admin.models';
import { MockAdminBackend } from './mock-admin.backend';

/**
 * Todos estos endpoints exigen rol ADMINISTRADOR. El backend debe validarlo en cada petición:
 * lo que se oculta o desactiva en pantalla NO es seguridad.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private mock = new MockAdminBackend();

  private readonly baseUrl = `${environment.apiUrl}/admin`;

  private toParams(filters: object): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, String(value));
      }
    });
    return params;
  }

  /** GET /api/admin/statistics */
  getStatistics(filters: StatisticsFilters = {}): Observable<AdminStatistics> {
    return environment.useMock
      ? this.mock.getStatistics(filters)
      : this.http.get<AdminStatistics>(`${this.baseUrl}/statistics`, { params: this.toParams(filters) });
  }

  /** GET /api/admin/users */
  listUsers(): Observable<AdminUser[]> {
    return environment.useMock
      ? this.mock.listUsers()
      : this.http.get<AdminUser[]>(`${this.baseUrl}/users`);
  }

  /** POST /api/admin/users */
  createUser(request: CreateUserRequest): Observable<AdminUser> {
    return environment.useMock
      ? this.mock.createUser(request)
      : this.http.post<AdminUser>(`${this.baseUrl}/users`, request);
  }

  /** PUT /api/admin/users/{id} */
  updateUser(id: number, request: UpdateUserRequest): Observable<AdminUser> {
    return environment.useMock
      ? this.mock.updateUser(id, request)
      : this.http.put<AdminUser>(`${this.baseUrl}/users/${id}`, request);
  }

  /** PUT /api/admin/users/{id}/status */
  setUserStatus(id: number, status: 'ACTIVE' | 'BLOCKED'): Observable<AdminUser> {
    return environment.useMock
      ? this.mock.setUserStatus(id, status)
      : this.http.put<AdminUser>(`${this.baseUrl}/users/${id}/status`, { status });
  }

  /** DELETE /api/admin/users/{id} */
  deleteUser(id: number): Observable<void> {
    return environment.useMock
      ? this.mock.deleteUser(id)
      : this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  /** GET /api/admin/audit (solo lectura) */
  getAudit(filters: AuditFilters = {}): Observable<AuditEntry[]> {
    return environment.useMock
      ? this.mock.getAudit(filters)
      : this.http.get<AuditEntry[]>(`${this.baseUrl}/audit`, { params: this.toParams(filters) });
  }

  /** GET /api/admin/reports/{type}?format=csv|xlsx|pdf */
  downloadReport(type: ReportType, format: ReportFormat): Observable<ReportFile> {
    if (environment.useMock) {
      return this.mock.downloadReport(type, format);
    }
    return this.http
      .get(`${this.baseUrl}/reports/${type}`, {
        params: new HttpParams().set('format', format),
        responseType: 'blob'
      })
      .pipe(map(blob => ({ blob, filename: `${type}.${format}` })));
  }
}
