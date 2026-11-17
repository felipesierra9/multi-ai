import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { AdminStatistics } from '../../../core/models/admin.models';
import { MediaType } from '../../../core/models/generation.models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-statistics',
  standalone: false,
  template: `
    <div class="page">
      <h2>Estadísticas</h2>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: datos de EJEMPLO. El filtro por usuario solo funciona con el backend.
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="apply()" class="filters-form">
        <label>Fecha inicial
          <input type="date" formControlName="from" />
        </label>
        <label>Fecha final
          <input type="date" formControlName="to" />
        </label>
        <label>Usuario (correo)
          <input type="text" formControlName="user" placeholder="correo@ejemplo.com" />
        </label>
        <label>Tipo de contenido
          <select formControlName="mediaType">
            <option value="">Todos</option>
            <option value="IMAGE">Imagen</option>
            <option value="VIDEO">Video</option>
            <option value="AUDIO">Audio</option>
            <option value="TEXT">Texto</option>
          </select>
        </label>
        <label>Proveedor de IA
          <select formControlName="provider">
            <option value="">Todos</option>
            @for (p of providerOptions; track p) {
              <option [value]="p">{{ p }}</option>
            }
          </select>
        </label>
        <div class="filters-form__actions">
          <button type="submit" class="btn" [disabled]="loading">Aplicar</button>
          <button type="button" class="btn btn-secondary" (click)="reset()">Limpiar</button>
        </div>
      </form>

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      @if (stats; as s) {
        <div class="charts-grid">
          <app-bar-chart title="Actividad por día (últimos 14 días)" [data]="s.activityByDay" orientation="vertical"></app-bar-chart>
          <app-bar-chart title="Actividad por mes" [data]="s.activityByMonth" orientation="vertical"></app-bar-chart>
          <app-bar-chart title="Registros de usuarios por mes" [data]="s.registrationsByMonth" orientation="vertical"></app-bar-chart>
          <app-bar-chart title="Generaciones por categoría" [data]="s.byCategory"></app-bar-chart>
          <app-bar-chart title="Uso y comparación de proveedores de IA" [data]="s.byProvider"></app-bar-chart>
        </div>
      } @else if (loading) {
        <div class="spinner"></div>
      }
    </div>
  `
})
export class StatisticsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private admin = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;

  form = this.fb.nonNullable.group({
    from: [''],
    to: [''],
    user: [''],
    mediaType: ['' as MediaType | ''],
    provider: ['']
  });

  stats: AdminStatistics | null = null;
  providerOptions: string[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    if (this.useMock) {
      this.form.controls.user.disable();
    }
    this.load(true);
  }

  apply(): void {
    this.load(false);
  }

  reset(): void {
    this.form.reset({ from: '', to: '', user: '', mediaType: '', provider: '' });
    this.load(false);
  }

  private load(firstLoad: boolean): void {
    this.loading = true;
    this.error = '';

    this.admin.getStatistics(this.form.getRawValue()).subscribe({
      next: stats => {
        this.stats = stats;
        if (firstLoad) {
          this.providerOptions = stats.byProvider.map(p => p.label);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : 'No se pudieron cargar las estadísticas.';
        this.cdr.markForCheck();
      }
    });
  }
}
