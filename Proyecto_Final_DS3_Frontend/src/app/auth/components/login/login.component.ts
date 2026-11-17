import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="auth-box">
      <h2>Iniciar sesión</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label
          >Correo electrónico
          <input type="email" formControlName="email" autocomplete="username" />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <small class="error">Ingresa un correo válido.</small>
        }

        <label
          >Contraseña
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <small class="error">La contraseña es obligatoria.</small>
        }

        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }

        <button type="submit" class="btn" [disabled]="loading">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <p><a routerLink="/auth/forgot-password">¿Olvidaste tu contraseña?</a></p>
      <p>¿No tienes cuenta? <a routerLink="/auth/register">Regístrate</a></p>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error =
          err.status === 0
            ? 'No se pudo conectar con el servidor.'
            : (err.error?.message ?? 'Correo o contraseña incorrectos.');
      },
    });
  }
}
