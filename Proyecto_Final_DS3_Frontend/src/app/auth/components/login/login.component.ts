import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="auth-box">
      <h2>Iniciar sesión</h2>
      <p>Pantalla en construcción (Fase F3).</p>
      <p><a routerLink="/auth/register">Crear cuenta</a></p>
      <p><a routerLink="/auth/forgot-password">¿Olvidaste tu contraseña?</a></p>
      <p><a routerLink="/dashboard">Entrar al panel (solo para pruebas)</a></p>
    </div>
  `,
})
export class LoginComponent {}
