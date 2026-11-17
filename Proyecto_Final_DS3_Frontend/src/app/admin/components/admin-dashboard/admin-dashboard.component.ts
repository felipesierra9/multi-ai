import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AdminStatistics } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  template: `
    <div class="page">
      <h2>Panel de administración</h2>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: las cifras son datos de EJEMPLO para probar la interfaz, no son reales.
        </div>
      }

      @if (loading) {
        <div class="spinner"></div>
      } @else if (error) {
        <div class="alert alert-error">{{ error }}</div>
      } @else if (stats; as s) {
        <div class="stats-grid">
          <div class="stat-card"><span class="muted">Usuarios registrados</span><strong>{{ s.totalUsers }}</strong></div>
          <div class="stat-card"><span class="muted">Usuarios activos</span><strong>{{ s.activeUsers }}</strong></div>
          <div class="stat-card"><span class="muted">Usuarios bloqueados</span><strong>{{ s.blockedUsers }}</strong></div>
          <div class="stat-card"><span class="muted">Total de generaciones</span><strong>{{ s.totalGenerations }}</strong></div>
          <div class="stat-card"><span class="muted">Imágenes</span><strong>{{ s.imageGenerations }}</strong></div>
          <div class="stat-card"><span class="muted">Videos</span><strong>{{ s.videoGenerations }}</strong></div>
          <div class="stat-card"><span class="muted">Audios</span><strong>{{ s.audioGenerations }}</strong></div>
          <div class="stat-card"><span class="muted">Textos</span><strong>{{ s.textGenerations }}</strong></div>
          <div class="stat-card"><span class="muted">Proveedor más usado</span><strong>{{ s.topProvider ?? '—' }}</strong></div>
          <div class="stat-card"><span class="muted">Día con mayor actividad</span><strong>{{ s.busiestDay ?? '—' }}</strong></div>
          <div class="stat-card"><span class="muted">Usuario más activo</span><strong>{{ s.topUser ?? '—' }}</strong></div>
        </div>

        <p><a routerLink="/admin/statistics">Ver gráficas y filtros →</a></p>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private admin = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;

  stats: AdminStatistics | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    this.admin.getStatistics().subscribe({
      next: stats => {
        this.stats = stats;
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
