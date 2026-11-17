import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  template: `
    <nav class="sidebar">
      <a
        routerLink="/dashboard"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        >Inicio</a
      >
      <a routerLink="/dashboard/generator" routerLinkActive="active">Generador</a>
      <a routerLink="/dashboard/history" routerLinkActive="active">Historial</a>
      <a routerLink="/dashboard/profile" routerLinkActive="active">Perfil</a>

      @if (auth.hasRole('ADMINISTRADOR')) {
        <div class="section">Administración</div>
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
          >Panel admin</a
        >
        <a routerLink="/admin/users" routerLinkActive="active">Usuarios</a>
        <a routerLink="/admin/audit" routerLinkActive="active">Auditoría</a>
        <a routerLink="/admin/statistics" routerLinkActive="active">Estadísticas</a>
        <a routerLink="/admin/reports" routerLinkActive="active">Reportes</a>
      }
    </nav>
  `,
})
export class SidebarComponent {
  auth = inject(AuthService);
}
