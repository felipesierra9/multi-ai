import { Observable, of } from 'rxjs';
import { AdminStatistics, ChartPoint, StatisticsFilters } from '../models/admin.models';
import { MediaType } from '../models/generation.models';

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

function seeded(n: number): number {
  return ((n * 37 + 11) % 17) + 3;
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface DayRow {
  date: string;
  counts: Record<MediaType, number>;
}

export class MockAdminBackend {
  private days: DayRow[] = this.buildDays();

  getStatistics(filters: StatisticsFilters): Observable<AdminStatistics> {
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

    return of({
      totalUsers: 24,
      activeUsers: 20,
      blockedUsers: 4,
      totalGenerations: total,
      imageGenerations: typeTotal('IMAGE'),
      videoGenerations: typeTotal('VIDEO'),
      audioGenerations: typeTotal('AUDIO'),
      textGenerations: typeTotal('TEXT'),
      topProvider,
      busiestDay: busiest,
      topUser: 'Usuario de ejemplo',
      activityByDay,
      activityByMonth,
      registrationsByMonth: this.registrations(),
      byCategory,
      byProvider
    });
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
}
