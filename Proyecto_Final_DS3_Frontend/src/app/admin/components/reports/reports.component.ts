import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ReportFormat, ReportType } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';
import { saveBlob } from '../../../core/utils/file.util';

@Component({
  selector: 'app-reports',
  standalone: false,
  template: `
    <div class="page">
      <h2>Reportes</h2>
      <p class="muted">Los reportes se generan en el backend y solo los pueden descargar administradores.</p>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: solo está disponible CSV con datos de EJEMPLO (el archivo se llama «ejemplo-...»).
          PDF y Excel se habilitan cuando exista el backend.
        </div>
      }
      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      @for (r of reports; track r.type) {
        <div class="card report-row">
          <div>
            <strong>{{ r.title }}</strong>
            <p class="muted">{{ r.description }}</p>
          </div>
          <div class="report-actions">
            @for (f of formats; track f.value) {
              <button type="button" class="btn btn-small"
                      [disabled]="busy !== null || (useMock && f.value !== 'csv')"
                      [title]="useMock && f.value !== 'csv' ? 'Disponible cuando exista el backend' : ''"
                      (click)="download(r.type, f.value)">
                {{ busy === r.type + '-' + f.value ? 'Generando...' : f.label }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ReportsComponent {
  private admin = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;

  readonly reports: { type: ReportType; title: string; description: string }[] = [
    { type: 'users', title: 'Reporte de usuarios', description: 'Listado de usuarios, roles y estados.' },
    { type: 'audit', title: 'Reporte de auditoría', description: 'Eventos de seguridad y actividad registrados.' },
    { type: 'generations', title: 'Reporte de generaciones', description: 'Contenido generado por tipo y proveedor.' },
    { type: 'statistics', title: 'Reporte de estadísticas', description: 'Resumen de métricas de la plataforma.' }
  ];

  readonly formats: { value: ReportFormat; label: string }[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'xlsx', label: 'Excel' },
    { value: 'csv', label: 'CSV' }
  ];

  busy: string | null = null;
  error = '';

  download(type: ReportType, format: ReportFormat): void {
    this.busy = `${type}-${format}`;
    this.error = '';

    this.admin.downloadReport(type, format).subscribe({
      next: file => {
        saveBlob(file.blob, file.filename);
        this.busy = null;
        this.cdr.markForCheck();
      },
      error: err => {
        this.busy = null;
        this.error = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : (err.error?.message ?? 'No se pudo generar el reporte.');
        this.cdr.markForCheck();
      }
    });
  }
}
