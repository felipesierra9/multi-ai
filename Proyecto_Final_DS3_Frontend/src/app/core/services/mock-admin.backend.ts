import { Observable, of, throwError } from 'rxjs';
import {
  AdminStatistics, AdminUser, AuditEntry, AuditFilters, AuditResult, ChartPoint,
  CreateUserRequest, ReportFile, ReportFormat, ReportType, StatisticsFilters,
  UpdateUserRequest, UserStatus
} from '../models/admin.models';
import { MediaType } from '../models/generation.models';
import { toCsv } from '../utils/csv.util';

/**
 * MODO SIMULADO: datos de EJEMPLO para desarrollar la interfaz sin backend.
 * No son cifras reales. Se desactiva con useMock: false en environment.ts.
 */
const PROVIDERS = ['Proveedor IA 1', 'Proveedor IA 2', 'Proveedor IA 3', 'Proveedor IA 4'];
const SHARES = [0.35, 0.3, 0.2, 0.15];
const TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'AUDIO', 'TEXT'];
const TYPE_LABELS: Record<MediaType, string> = {
  IMAGE: 'Imagen',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  TEXT: 'Texto'
};
const DAYS = 90;
const AUDIT_COUNT = 60;

const AUDIT_TEMPLATES: [string, string, AuditResult][] = [
  ['USER_REGISTERED', 'Registro de usuario', 'SUCCESS'],
  ['LOGIN_SUCCESS', 'Inicio de sesión', 'SUCCESS'],
  ['LOGIN_FAILED', 'Intento fallido de inicio de sesión', 'FAILURE'],
  ['EMAIL_VERIFIED', 'Verificación de correo', 'SUCCESS'],
  ['PASSWORD_RESET_REQUESTED', 'Solicitud de recuperación de contraseña', 'SUCCESS'],
  ['PASSWORD_CHANGED', 'Cambio de contraseña', 'SUCCESS'],
  ['CONTENT_GENERATED', 'Generación de contenido', 'SUCCESS'],
  ['FILE_DOWNLOADED', 'Descarga de archivo', 'SUCCESS'],
  ['ADMIN_USER_UPDATED', 'Modificación administrativa de usuario', 'SUCCESS'],
  ['USER_BLOCKED', 'Bloqueo de cuenta', 'SUCCESS'],
  ['USER_DELETED', 'Eliminación de usuario', 'SUCCESS']
];

function seeded(n: number): number {
  return ((n * 37 + 11) % 17) + 3;
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

interface DayRow {
  date: string;
  counts: Record<MediaType, number>;
}

export class MockAdminBackend {
  private days: DayRow[] = this.buildDays();
  private users: AdminUser[] = this.buildUsers();
  private audit: AuditEntry[] = this.buildAudit();
  private nextUserId = 100;

  /* ---------- Estadísticas ---------- */
  getStatistics(filters: StatisticsFilters): Observable<AdminStatistics> {
    return of(this.computeStatistics(filters));
  }

  private computeStatistics(filters: StatisticsFilters): AdminStatistics {
    const providerIdx = PROVIDERS.indexOf(filters.provider ?? '');
    const factor = providerIdx >= 0 ? SHARES[providerIdx] : 1;
    const types: MediaType[] = filters.mediaType ? [filters.mediaType] : TYPES;

    const rows = this.days.filter(d =>
      (!filters.from || d.date >= filters.from) && (!filters.to || d.date <= filters.to)
    );

    const perDay = rows.map(d => ({
      date: d.date,
      total: types.reduce((sum, t) => sum + Math.round(d.counts[t] * factor), 0)
    }));
    const total = perDay.reduce((sum, d) => sum + d.total, 0);

    const typeTotal = (t: MediaType): number =>
      types.includes(t) ? rows.reduce((sum, d) => sum + Math.round(d.counts[t] * factor), 0) : 0;

    const byCategory: ChartPoint[] = TYPES.map(t => ({ label: TYPE_LABELS[t], value: typeTotal(t) }));

    const byProvider: ChartPoint[] = providerIdx >= 0
      ? [{ label: PROVIDERS[providerIdx], value: total }]
      : PROVIDERS.map((p, i) => ({ label: p, value: Math.round(total * SHARES[i]) }));

    const topProvider = byProvider.length
      ? byProvider.reduce((a, b) => (b.value > a.value ? b : a)).label
      : null;
    const busiest = perDay.length
      ? perDay.reduce((a, b) => (b.total > a.total ? b : a)).date
      : null;

    const activityByDay: ChartPoint[] = perDay.slice(-14).map(d => ({
      label: `${d.date.substring(8, 10)}/${d.date.substring(5, 7)}`,
      value: d.total
    }));

    const months = new Map<string, number>();
    perDay.forEach(d => {
      const key = d.date.substring(0, 7);
      months.set(key, (months.get(key) ?? 0) + d.total);
    });
    const activityByMonth: ChartPoint[] = Array.from(months.entries()).map(([label, value]) => ({
      label,
      value
    }));

    const topUser = this.users.reduce((a, b) => (b.generationsCount > a.generationsCount ? b : a));

    return {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.status === 'ACTIVE').length,
      blockedUsers: this.users.filter(u => u.status === 'BLOCKED').length,
      totalGenerations: total,
      imageGenerations: typeTotal('IMAGE'),
      videoGenerations: typeTotal('VIDEO'),
      audioGenerations: typeTotal('AUDIO'),
      textGenerations: typeTotal('TEXT'),
      topProvider,
      busiestDay: busiest,
      topUser: topUser.email,
      activityByDay,
      activityByMonth,
      registrationsByMonth: this.registrations(),
      byCategory,
      byProvider
    };
  }

  /* ---------- Usuarios ---------- */
  listUsers(): Observable<AdminUser[]> {
    return of(this.users.map(u => ({ ...u })));
  }

  createUser(request: CreateUserRequest): Observable<AdminUser> {
    const exists = this.users.some(u => u.email.toLowerCase() === request.email.toLowerCase());
    if (exists) {
      return this.fail(409, 'Ya existe un usuario con ese correo.');
    }
    const user: AdminUser = {
      id: this.nextUserId++,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      role: request.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      generationsCount: 0
    };
    this.users.push(user);
    return of({ ...user });
  }

  updateUser(id: number, request: UpdateUserRequest): Observable<AdminUser> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return this.fail(404, 'Usuario no encontrado.');
    }
    user.firstName = request.firstName;
    user.lastName = request.lastName;
    user.role = request.role;
    return of({ ...user });
  }

  setUserStatus(id: number, status: 'ACTIVE' | 'BLOCKED'): Observable<AdminUser> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return this.fail(404, 'Usuario no encontrado.');
    }
    user.status = status;
    return of({ ...user });
  }

  deleteUser(id: number): Observable<void> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return this.fail(404, 'Usuario no encontrado.');
    }
    if (user.generationsCount > 0) {
      return this.fail(409, 'No se puede eliminar: el usuario tiene generaciones asociadas. Bloquéalo en su lugar.');
    }
    this.users = this.users.filter(u => u.id !== id);
    return of(void 0);
  }

  /* ---------- Auditoría ---------- */
  getAudit(filters: AuditFilters): Observable<AuditEntry[]> {
    const q = (filters.search ?? '').trim().toLowerCase();
    const list = this.audit.filter(e => {
      const date = e.createdAt.substring(0, 10);
      return (!filters.from || date >= filters.from) &&
        (!filters.to || date <= filters.to) &&
        (!filters.action || e.action === filters.action) &&
        (!filters.result || e.result === filters.result) &&
        (!q || e.description.toLowerCase().includes(q) || (e.userEmail ?? '').toLowerCase().includes(q));
    });
    return of(list.map(e => ({ ...e })));
  }

  /* ---------- Reportes (solo CSV en modo simulado) ---------- */
  downloadReport(type: ReportType, format: ReportFormat): Observable<ReportFile> {
    if (format !== 'csv') {
      return this.fail(501, 'PDF y Excel se generan en el backend.');
    }
    const { headers, rows } = this.buildReport(type);
    return of({
      blob: new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' }),
      filename: `ejemplo-${type}.csv`
    });
  }

  private buildReport(type: ReportType): { headers: string[]; rows: (string | number | null)[][] } {
    switch (type) {
      case 'users':
        return {
          headers: ['ID', 'Nombre', 'Apellido', 'Correo', 'Rol', 'Estado', 'Registro', 'Generaciones'],
          rows: this.users.map(u => [
            u.id, u.firstName, u.lastName, u.email, u.role, u.status,
            u.createdAt.substring(0, 10), u.generationsCount
          ])
        };
      case 'audit':
        return {
          headers: ['ID', 'Usuario', 'Acción', 'Descripción', 'Fecha', 'Hora', 'IP', 'Navegador', 'Resultado'],
          rows: this.audit.map(e => [
            e.id, e.userEmail, e.action, e.description,
            e.createdAt.substring(0, 10), e.createdAt.substring(11, 19),
            e.ipAddress, e.userAgent, e.result
          ])
        };
      case 'generations': {
        const rows: (string | number)[][] = [];
        for (let i = 0; i < 30; i++) {
          rows.push([
            i + 1,
            `ejemplo${(i % 11) + 1}@ejemplo.com`,
            TYPE_LABELS[TYPES[i % 4]],
            PROVIDERS[(i * 3) % 4],
            i % 7 === 0 ? 'FAILED' : 'COMPLETED',
            daysAgoIso(i).substring(0, 10)
          ]);
        }
        return { headers: ['ID', 'Usuario', 'Tipo', 'Proveedor', 'Estado', 'Fecha'], rows };
      }
      default: {
        const s = this.computeStatistics({});
        const rows: (string | number)[][] = [
          ['Usuarios registrados', s.totalUsers],
          ['Usuarios activos', s.activeUsers],
          ['Usuarios bloqueados', s.blockedUsers],
          ['Total de generaciones', s.totalGenerations],
          ...s.byCategory.map((p): (string | number)[] => [`Categoría: ${p.label}`, p.value]),
          ...s.byProvider.map((p): (string | number)[] => [`Proveedor: ${p.label}`, p.value])
        ];
        return { headers: ['Métrica', 'Valor'], rows };
      }
    }
  }

  /* ---------- Construcción de datos de ejemplo ---------- */
  private fail(status: number, message: string): Observable<never> {
    return throwError(() => ({ status, error: { message } }));
  }

  private registrations(): ChartPoint[] {
    const values = [3, 5, 2, 6, 4, 4];
    const now = new Date();
    return values.map((value, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (values.length - 1 - i), 1);
      return { label: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, value };
    });
  }

  private buildDays(): DayRow[] {
    const rows: DayRow[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      rows.push({
        date: isoDate(date),
        counts: {
          IMAGE: seeded(i),
          VIDEO: seeded(i + 5) % 8,
          AUDIO: seeded(i + 9) % 6,
          TEXT: seeded(i + 13)
        }
      });
    }
    return rows;
  }

  private buildUsers(): AdminUser[] {
    const list: AdminUser[] = [{
      id: 1,
      firstName: 'Admin',
      lastName: 'Prueba',
      email: 'admin@prueba.com',
      role: 'ADMINISTRADOR',
      status: 'ACTIVE',
      createdAt: daysAgoIso(120),
      generationsCount: 0
    }];
    const statuses: UserStatus[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'BLOCKED', 'UNVERIFIED'];
    for (let i = 1; i <= 11; i++) {
      list.push({
        id: i + 1,
        firstName: 'Usuario',
        lastName: `Ejemplo ${i}`,
        email: `ejemplo${i}@ejemplo.com`,
        role: 'CLIENTE',
        status: statuses[i % 5],
        createdAt: daysAgoIso(i * 9),
        generationsCount: i % 3 === 0 ? 0 : seeded(i)
      });
    }
    return list;
  }

  private buildAudit(): AuditEntry[] {
    const entries: AuditEntry[] = [];
    for (let i = 0; i < AUDIT_COUNT; i++) {
      const [action, text, result] = AUDIT_TEMPLATES[(i * 7 + 3) % AUDIT_TEMPLATES.length];
      const when = new Date(Date.now() - i * 7 * 3600000 - (i % 5) * 13 * 60000);
      entries.push({
        id: AUDIT_COUNT - i,
        userEmail: i % 9 === 0 ? null : `ejemplo${(i % 11) + 1}@ejemplo.com`,
        action,
        description: `${text} (dato de ejemplo)`,
        createdAt: when.toISOString(),
        ipAddress: `192.0.2.${(i % 200) + 1}`,
        userAgent: 'Navegador de ejemplo',
        result
      });
    }
    return entries;
  }
}
