import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-box">
      <h2>Crear cuenta</h2>
      <p>Pantalla en construcción (Fase F3).</p>
      <p><a routerLink="/auth/login">Volver al inicio de sesión</a></p>
    </div>
  `,
})
export class RegisterComponent {}
