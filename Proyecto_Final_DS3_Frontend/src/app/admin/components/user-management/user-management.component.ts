import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { Role } from '../../../core/models/auth.models';
import { AdminUser, UserStatus } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: false,
  template: `
    <div class="page wide">
      <div class="page-head">
        <h2>Gestión de usuarios</h2>
        <button type="button" class="btn" (click)="openCreate()">Nuevo usuario</button>
      </div>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: usuarios de EJEMPLO. Los cambios solo viven en esta sesión del navegador.
        </div>
      }
      @if (message) {
        <div class="alert alert-ok">{{ message }}</div>
      }
      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      <div class="filters">
        <input type="text" placeholder="Buscar por nombre o correo..." [(ngModel)]="search" />
        <select [(ngModel)]="statusFilter">
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="BLOCKED">Bloqueados</option>
          <option value="UNVERIFIED">Sin verificar</option>
        </select>
      </div>

      @if (loading) {
        <div class="spinner"></div>
      } @else if (filtered.length === 0) {
        <p class="muted">No hay usuarios para mostrar.</p>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th>
                <th>Registro</th><th>Gen.</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of filtered; track u.id) {
                <tr>
                  <td>{{ u.firstName }} {{ u.lastName }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.role === 'ADMINISTRADOR' ? 'Administrador' : 'Cliente' }}</td>
                  <td><span class="badge" [attr.data-status]="u.status">{{ statusLabel(u.status) }}</span></td>
                  <td>{{ u.createdAt | date: 'yyyy-MM-dd' }}</td>
                  <td>{{ u.generationsCount }}</td>
                  <td class="row-actions">
                    <button type="button" class="btn btn-small" (click)="openEdit(u)">Editar</button>
                    <button type="button" class="btn btn-small btn-secondary"
                            [disabled]="isSelf(u) || u.status === 'UNVERIFIED'"
                            (click)="toggleBlock(u)">
                      {{ u.status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear' }}
                    </button>
                    <button type="button" class="btn btn-small btn-danger"
                            [disabled]="isSelf(u)" (click)="askDelete(u)">Eliminar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showForm) {
      <div class="modal-backdrop" (click)="closeForm()">
        <div class="modal modal-form" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <strong>{{ editing ? 'Editar usuario' : 'Nuevo usuario' }}</strong>
            <button type="button" class="btn btn-small" (click)="closeForm()">Cerrar</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submitForm()" novalidate>
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
              <input type="email" formControlName="email" />
            </label>
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <small class="error">Ingresa un correo válido.</small>
            }

            @if (!editing) {
              <label>Contraseña inicial
                <input type="password" formControlName="password" autocomplete="new-password" />
              </label>
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <small class="error">Mínimo 8 caracteres, con mayúscula, minúscula y número.</small>
              }
            }

            <label>Rol
              <select formControlName="role">
                <option value="CLIENTE">Cliente</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </label>
            @if (editing && isSelf(editing)) {
              <small class="muted">No puedes cambiar tu propio rol.</small>
            }

            @if (formError) {
              <div class="alert alert-error">{{ formError }}</div>
            }

            <button type="submit" class="btn" [disabled]="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </form>
        </div>
      </div>
    }

    @if (toDelete; as d) {
      <div class="modal-backdrop" (click)="cancelDelete()">
        <div class="modal modal-form" (click)="$event.stopPropagation()">
          <div class="modal-head"><strong>Eliminar usuario</strong></div>
          <p>¿Seguro que quieres eliminar a <strong>{{ d.firstName }} {{ d.lastName }}</strong> ({{ d.email }})?
             Esta acción no se puede deshacer.</p>
          <p class="muted">Si el usuario tiene generaciones asociadas no se podrá eliminar; en ese caso, bloquéalo.</p>
          <div class="row-actions">
            <button type="button" class="btn btn-secondary" (click)="cancelDelete()">Cancelar</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()">Eliminar</button>
          </div>
        </div>
      </div>
    }
  `
})
export class UserManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private admin = inject(AdminService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;
  readonly currentEmail = (this.auth.getUser()?.email ?? '').toLowerCase();

  users: AdminUser[] = [];
  loading = true;
  error = '';
  message = '';

  search = '';
  statusFilter: UserStatus | '' = '';

  showForm = false;
  editing: AdminUser | null = null;
  saving = false;
  formError = '';
  toDelete: AdminUser | null = null;

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    ]],
    role: ['CLIENTE' as Role]
  });

  ngOnInit(): void {
    this.load();
  }

  get filtered(): AdminUser[] {
    const q = this.search.trim().toLowerCase();
    return this.users.filter(u =>
      (!this.statusFilter || u.status === this.statusFilter) &&
      (!q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
    );
  }

  isSelf(u: AdminUser): boolean {
    return u.email.toLowerCase() === this.currentEmail;
  }

  statusLabel(status: UserStatus): string {
    return { ACTIVE: 'Activo', BLOCKED: 'Bloqueado', UNVERIFIED: 'Sin verificar' }[status];
  }

  private load(): void {
    this.loading = true;
    this.admin.listUsers().subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => this.showError(err, 'No se pudo cargar la lista de usuarios.')
    });
  }

  openCreate(): void {
    this.editing = null;
    this.formError = '';
    this.form.reset({ firstName: '', lastName: '', email: '', password: '', role: 'CLIENTE' });
    this.form.controls.email.enable();
    this.form.controls.password.enable();
    this.form.controls.role.enable();
    this.showForm = true;
  }

  openEdit(u: AdminUser): void {
    this.editing = u;
    this.formError = '';
    this.form.reset({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: '',
      role: u.role
    });
    this.form.controls.email.disable();
    this.form.controls.password.disable();
    if (this.isSelf(u)) {
      this.form.controls.role.disable();
    } else {
      this.form.controls.role.enable();
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.formError = '';
    const raw = this.form.getRawValue();

    const request$ = this.editing
      ? this.admin.updateUser(this.editing.id, {
          firstName: raw.firstName,
          lastName: raw.lastName,
          role: raw.role
        })
      : this.admin.createUser({
          firstName: raw.firstName,
          lastName: raw.lastName,
          email: raw.email,
          password: raw.password,
          role: raw.role
        });

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.notify(this.editing ? 'Usuario actualizado.' : 'Usuario creado.');
        this.load();
      },
      error: err => {
        this.saving = false;
        this.formError = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : (err.error?.message ?? 'No se pudo guardar el usuario.');
        this.cdr.markForCheck();
      }
    });
  }

  toggleBlock(u: AdminUser): void {
    const next = u.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    this.admin.setUserStatus(u.id, next).subscribe({
      next: () => {
        this.notify(next === 'BLOCKED' ? 'Usuario bloqueado.' : 'Usuario desbloqueado.');
        this.load();
      },
      error: err => this.showError(err, 'No se pudo cambiar el estado.')
    });
  }

  askDelete(u: AdminUser): void {
    this.toDelete = u;
  }

  cancelDelete(): void {
    this.toDelete = null;
  }

  confirmDelete(): void {
    const target = this.toDelete;
    if (!target) {
      return;
    }
    this.toDelete = null;
    this.admin.deleteUser(target.id).subscribe({
      next: () => {
        this.notify('Usuario eliminado.');
        this.load();
      },
      error: err => this.showError(err, 'No se pudo eliminar el usuario.')
    });
  }

  private notify(text: string): void {
    this.error = '';
    this.message = text;
    this.cdr.markForCheck();
  }

  private showError(err: { status?: number; error?: { message?: string } }, fallback: string): void {
    this.loading = false;
    this.message = '';
    this.error = err.status === 0
      ? 'No se pudo conectar con el servidor.'
      : (err.error?.message ?? fallback);
    this.cdr.markForCheck();
  }
}
