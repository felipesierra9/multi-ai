import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

/** Valida que "contraseña" y "confirmar contraseña" sean iguales. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-box">
      <h2>Crear cuenta</h2>

      @if (success) {
        <div class="alert alert-ok">{{ success }}</div>
        <p><a routerLink="/auth/login">Ir al inicio de sesión</a></p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label>Nombre
            <input type="text" formControlName="firstName" />
          </label>
          @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
            <small class="error">El nombre es obligatorio.</small>
          }

          <label>Apellido
            <input type="text" formControlName="lastName" />
          </label>
          @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
            <small class="error">El apellido es obligatorio.</small>
          }

          <label>Correo electrónico
            <input type="email" formControlName="email" autocomplete="username" />
          </label>
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <small class="error">Ingresa un correo válido.</small>
          }

          <label>Contraseña
            <input type="password" formControlName="password" autocomplete="new-password" />
          </label>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <small class="error">Mínimo 8 caracteres, con mayúscula, minúscula y número.</small>
          }

          <label>Confirmar contraseña
            <input type="password" formControlName="confirmPassword" autocomplete="new-password" />
          </label>
          @if (form.controls.confirmPassword.touched && form.hasError('mismatch')) {
            <small class="error">Las contraseñas no coinciden.</small>
          }

          @if (error) {
            <div class="alert alert-error">{{ error }}</div>
          }

          <button type="submit" class="btn" [disabled]="loading">
            {{ loading ? 'Creando cuenta...' : 'Registrarme' }}
          </button>
        </form>

        <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
      }
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = false;
  error = '';
  success = '';

  form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(60)]],
      lastName: ['', [Validators.required, Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatch }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.register(this.form.getRawValue()).subscribe({
      next: res => {
        this.loading = false;
        this.success = res.message || 'Cuenta creada. Revisa tu correo para verificarla.';
      },
      error: err => {
        this.loading = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : (err.error?.message ?? 'No se pudo crear la cuenta.');
      }
    });
  }
}
