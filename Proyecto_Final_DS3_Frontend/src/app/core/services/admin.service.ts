import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminStatistics, StatisticsFilters } from '../models/admin.models';
import { MockAdminBackend } from './mock-admin.backend';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private mock = new MockAdminBackend();

  private readonly baseUrl = `${environment.apiUrl}/admin`;

  /** GET /api/admin/statistics (solo rol ADMINISTRADOR; el backend lo valida). */
  getStatistics(filters: StatisticsFilters = {}): Observable<AdminStatistics> {
    if (environment.useMock) {
      return this.mock.getStatistics(filters);
    }
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<AdminStatistics>(`${this.baseUrl}/statistics`, { params });
  }
}
