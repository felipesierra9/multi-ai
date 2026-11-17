import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  template: `
    <div class="auth-box">
      <h2>Recuperar contraseña</h2>

      @if (success) {
        <div class="alert alert-ok">{{ message }}</div>
        <p><a routerLink="/auth/login">Volver al inicio de sesión</a></p>
      } @else {
        <p class="muted">Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label>Correo electrónico
            <input type="email" formControlName="email" autocomplete="username" />
          </label>
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <small class="error">Ingresa un correo válido.</small>
          }

          @if (error) {
            <div class="alert alert-error">{{ error }}</div>
          }

          <button type="submit" class="btn" [disabled]="loading">
            {{ loading ? 'Enviando...' : 'Enviar enlace' }}
          </button>
        </form>

        <p><a routerLink="/auth/login">Volver</a></p>
      }
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  success = false;
  message = '';
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.forgotPassword(this.form.getRawValue()).subscribe({
      next: res => {
        this.loading = false;
        this.success = true;
        this.message = res.message;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : 'No se pudo procesar la solicitud. Intenta de nuevo más tarde.';
        this.cdr.markForCheck();
      }
    });
  }
}
