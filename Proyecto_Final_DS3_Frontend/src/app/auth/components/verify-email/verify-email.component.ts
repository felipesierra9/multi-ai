import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  template: `
    <div class="auth-box">
      <h2>Verificar correo</h2>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: prueba con ?token=demo-valido, ?token=demo-usado o ?token=demo-vencido en la dirección.
        </div>
      }

      @if (loading) {
        <div class="spinner"></div>
        <p class="muted">Verificando tu correo...</p>
      } @else if (success) {
        <div class="alert alert-ok">{{ message }}</div>
        <p><a routerLink="/auth/login">Iniciar sesión</a></p>
      } @else {
        <div class="alert alert-error">{{ message }}</div>
        <p><a routerLink="/auth/register">Volver al registro</a> · <a routerLink="/auth/login">Iniciar sesión</a></p>
      }
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;

  loading = true;
  success = false;
  message = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.message = 'El enlace no es válido: falta el token de verificación.';
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: res => {
        this.loading = false;
        this.success = true;
        this.message = res.message;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.message = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : (err.error?.message ?? 'No se pudo verificar el correo.');
        this.cdr.markForCheck();
      }
    });
  }
}
