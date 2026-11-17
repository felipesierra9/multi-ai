import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: `
    <header class="navbar">
      <span class="brand">MULTI-AI STUDIO</span>
      <div class="navbar-user">
        <span>{{ auth.getUser()?.firstName }} {{ auth.getUser()?.lastName }}</span>
        <button type="button" class="btn btn-small" (click)="auth.logout()">Salir</button>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
}
