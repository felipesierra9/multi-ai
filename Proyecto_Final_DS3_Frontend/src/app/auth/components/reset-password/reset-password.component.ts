import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

/** Valida que "contraseña" y "confirmar contraseña" sean iguales. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: false,
  template: `
    <div class="auth-box">
      <h2>Nueva contraseña</h2>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: prueba con ?token=demo-valido, ?token=demo-usado o ?token=demo-vencido en la dirección.
        </div>
      }

      @if (!token) {
        <div class="alert alert-error">El enlace no es válido: falta el token.</div>
        <p><a routerLink="/auth/forgot-password">Solicitar un enlace nuevo</a></p>
      } @else if (success) {
        <div class="alert alert-ok">{{ message }}</div>
        <p><a routerLink="/auth/login">Iniciar sesión</a></p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label>Contraseña nueva
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
            <p><a routerLink="/auth/forgot-password">Solicitar un enlace nuevo</a></p>
          }

          <button type="submit" class="btn" [disabled]="loading">
            {{ loading ? 'Guardando...' : 'Cambiar contraseña' }}
          </button>
        </form>
      }
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;

  token: string | null = null;
  loading = false;
  success = false;
  message = '';
  error = '';

  form = this.fb.nonNullable.group(
    {
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatch }
  );

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.resetPassword({ token: this.token, ...this.form.getRawValue() }).subscribe({
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
          : (err.error?.message ?? 'No se pudo cambiar la contraseña.');
        this.cdr.markForCheck();
      }
    });
  }
}
