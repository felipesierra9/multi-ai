import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { UserProfile } from '../../../core/models/user.models';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  template: `
    <div class="page">
      <h2>Mi perfil</h2>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: los cambios se guardan solo en la sesión simulada de este navegador.
        </div>
      }

      @if (loading) {
        <div class="spinner"></div>
      } @else if (profile; as p) {
        <div class="card profile-card">
          <div class="profile-meta">
            <div><span class="muted">Correo</span><strong>{{ p.email }}</strong></div>
            <div><span class="muted">Rol</span><strong>{{ p.role === 'ADMINISTRADOR' ? 'Administrador' : 'Cliente' }}</strong></div>
            <div>
              <span class="muted">Miembro desde</span>
              <strong>{{ p.createdAt ? (p.createdAt | date: 'longDate') : '—' }}</strong>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" novalidate>
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

            @if (message) {
              <div class="alert alert-ok">{{ message }}</div>
            }
            @if (error) {
              <div class="alert alert-error">{{ error }}</div>
            }

            <button type="submit" class="btn" [disabled]="saving">
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </form>
        </div>
      } @else if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private users = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;

  profile: UserProfile | null = null;
  loading = true;
  saving = false;
  message = '';
  error = '';

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]]
  });

  ngOnInit(): void {
    this.users.getMe().subscribe({
      next: profile => {
        this.profile = profile;
        this.form.patchValue({ firstName: profile.firstName, lastName: profile.lastName });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : 'No se pudo cargar tu perfil.';
        this.cdr.markForCheck();
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.message = '';
    this.error = '';

    this.users.updateMe(this.form.getRawValue()).subscribe({
      next: profile => {
        this.profile = profile;
        this.saving = false;
        this.message = 'Datos actualizados.';
        this.cdr.markForCheck();
      },
      error: err => {
        this.saving = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : (err.error?.message ?? 'No se pudieron guardar los cambios.');
        this.cdr.markForCheck();
      }
    });
  }
}
