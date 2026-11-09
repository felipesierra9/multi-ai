import { Component } from '@angular/core';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  template: `
    <div class="auth-box">
      <h2>Recuperar contraseña</h2>
      <p>Pantalla en construcción (Fase F3).</p>
      <p><a routerLink="/auth/login">Volver</a></p>
    </div>
  `,
})
export class ForgotPasswordComponent {}
