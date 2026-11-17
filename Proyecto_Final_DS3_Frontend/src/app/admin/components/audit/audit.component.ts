import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { AUDIT_ACTIONS, AuditEntry, AuditResult } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-audit',
  standalone: false,
  template: `
    <div class="page wide">
      <h2>Auditoría</h2>
      <p class="muted">Registro de solo lectura: se genera automáticamente desde el backend y no puede modificarse desde aquí.</p>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: registros de EJEMPLO. No son eventos reales.
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="apply()" class="filters-form">
        <label>Fecha inicial
          <input type="date" formControlName="from" />
        </label>
        <label>Fecha final
          <input type="date" formControlName="to" />
        </label>
        <label>Acción
          <select formControlName="action">
            <option value="">Todas</option>
            @for (a of actions; track a) {
              <option [value]="a">{{ a }}</option>
            }
          </select>
        </label>
        <label>Resultado
          <select formControlName="result">
            <option value="">Todos</option>
            <option value="SUCCESS">Exitoso</option>
            <option value="FAILURE">Fallido</option>
          </select>
        </label>
        <label>Buscar
          <input type="text" formControlName="search" placeholder="Usuario o descripción" />
        </label>
        <div class="filters-form__actions">
          <button type="submit" class="btn" [disabled]="loading">Aplicar</button>
          <button type="button" class="btn btn-secondary" (click)="reset()">Limpiar</button>
        </div>
      </form>

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      @if (loading) {
        <div class="spinner"></div>
      } @else if (entries.length === 0) {
        <p class="muted">No hay registros para los filtros elegidos.</p>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th><th>Usuario</th><th>Acción</th><th>Descripción</th>
                <th>Fecha</th><th>Hora</th><th>IP</th><th>Navegador</th><th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              @for (e of pageItems; track e.id) {
                <tr>
                  <td>{{ e.id }}</td>
                  <td>{{ e.userEmail ?? '—' }}</td>
                  <td>{{ e.action }}</td>
                  <td>{{ e.description }}</td>
                  <td>{{ e.createdAt | date: 'yyyy-MM-dd' }}</td>
                  <td>{{ e.createdAt | date: 'HH:mm:ss' }}</td>
                  <td>{{ e.ipAddress ?? '—' }}</td>
                  <td>{{ e.userAgent ?? '—' }}</td>
                  <td><span class="badge" [attr.data-result]="e.result">{{ e.result === 'SUCCESS' ? 'Exitoso' : 'Fallido' }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button type="button" class="btn btn-small btn-secondary" [disabled]="page === 0" (click)="page = page - 1">Anterior</button>
          <span class="muted">Página {{ page + 1 }} de {{ totalPages }} · {{ entries.length }} registros</span>
          <button type="button" class="btn btn-small btn-secondary" [disabled]="page + 1 >= totalPages" (click)="page = page + 1">Siguiente</button>
        </div>
      }
    </div>
  `
})
export class AuditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private admin = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;
  readonly actions = AUDIT_ACTIONS;
  readonly pageSize = 10;

  form = this.fb.nonNullable.group({
    from: [''],
    to: [''],
    action: [''],
    result: ['' as AuditResult | ''],
    search: ['']
  });

  entries: AuditEntry[] = [];
  page = 0;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.load();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.entries.length / this.pageSize));
  }

  get pageItems(): AuditEntry[] {
    return this.entries.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize);
  }

  apply(): void {
    this.load();
  }

  reset(): void {
    this.form.reset({ from: '', to: '', action: '', result: '', search: '' });
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.page = 0;

    this.admin.getAudit(this.form.getRawValue()).subscribe({
      next: entries => {
        this.entries = entries;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : 'No se pudo cargar la auditoría.';
        this.cdr.markForCheck();
      }
    });
  }
}
