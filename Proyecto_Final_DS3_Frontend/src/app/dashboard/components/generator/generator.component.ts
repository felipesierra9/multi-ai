import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, switchMap, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MediaType, ProviderResult } from '../../../core/models/generation.models';
import { GenerationService } from '../../../core/services/generation.service';

@Component({
  selector: 'app-generator',
  standalone: false,
  template: `
    <div class="page generator">
      <h2>Generador multimedia</h2>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: las tarjetas muestran resultados de ejemplo para probar la interfaz.
          No provienen de ninguna IA real.
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="generate()" novalidate>
        <label>Describe lo que quieres generar
          <textarea formControlName="prompt" rows="4" maxlength="1000"
                    placeholder="Ej: un automóvil deportivo futurista en una ciudad de noche"></textarea>
        </label>
        @if (form.controls.prompt.touched && form.controls.prompt.invalid) {
          <small class="error">Escribe un prompt (máximo 1000 caracteres).</small>
        }

        <div class="segmented">
          @for (t of mediaTypes; track t.value) {
            <label [class.active]="form.controls.mediaType.value === t.value">
              <input type="radio" formControlName="mediaType" [value]="t.value" />
              {{ t.label }}
            </label>
          }
        </div>

        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }

        <button type="submit" class="btn" [disabled]="loading">
          {{ loading ? 'Generando...' : 'Generar' }}
        </button>
      </form>

      <div class="results-grid">
        @for (i of slots; track i) {
          <app-result-card
            [providerName]="'Proveedor IA ' + (i + 1)"
            [badge]="'IA ' + (i + 1)"
            [result]="resultAt(i)"
            (viewResult)="open($event)"
            (downloadResult)="download($event)">
          </app-result-card>
        }
      </div>
    </div>

    @if (selected; as r) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <strong>{{ r.providerName }}</strong>
            <button type="button" class="btn btn-small" (click)="close()">Cerrar</button>
          </div>
          <div class="modal-body">
            @if (r.mediaType === 'IMAGE' && r.contentUrl) {
              <img [src]="r.contentUrl" alt="Resultado generado" />
            } @else if (r.mediaType === 'VIDEO' && r.contentUrl) {
              <video [src]="r.contentUrl" controls></video>
            } @else if (r.mediaType === 'AUDIO' && r.contentUrl) {
              <audio [src]="r.contentUrl" controls></audio>
            } @else {
              <pre class="text-preview">{{ r.textContent || 'Resultado listo.' }}</pre>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class GeneratorComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(GenerationService);
  private cdr = inject(ChangeDetectorRef);

  private stop$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  readonly useMock = environment.useMock;
  readonly slots = [0, 1, 2, 3];
  readonly mediaTypes: { value: MediaType; label: string }[] = [
    { value: 'IMAGE', label: 'Imagen' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'AUDIO', label: 'Audio' },
    { value: 'TEXT', label: 'Texto' }
  ];

  form = this.fb.nonNullable.group({
    prompt: ['', [Validators.required, Validators.maxLength(1000)]],
    mediaType: ['IMAGE' as MediaType]
  });

  results: ProviderResult[] = [];
  loading = false;
  error = '';
  selected: ProviderResult | null = null;

  resultAt(index: number): ProviderResult | null {
    return this.results[index] ?? null;
  }

  generate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.stop$.next();
    this.loading = true;
    this.error = '';
    this.results = [];

    this.service.create(this.form.getRawValue()).subscribe({
      next: generation => {
        this.results = generation.results;
        this.cdr.markForCheck();
        this.poll(generation.id);
      },
      error: err => this.fail(err)
    });
  }

  /** Consulta los resultados cada 2 s hasta que ningún proveedor siga pendiente o procesando. */
  private poll(generationId: number): void {
    timer(1500, 2000)
      .pipe(
        switchMap(() => this.service.getResults(generationId)),
        tap(results => {
          this.results = results;
          this.cdr.markForCheck();
        }),
        takeWhile(results => results.some(r => r.status === 'PENDING' || r.status === 'PROCESSING'), true),
        takeUntil(this.stop$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        complete: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => this.fail(err)
      });
  }

  private fail(err: { status?: number; error?: { message?: string } }): void {
    this.loading = false;
    this.error = err.status === 0
      ? 'No se pudo conectar con el servidor.'
      : (err.error?.message ?? 'No se pudo completar la generación.');
    this.cdr.markForCheck();
  }

  open(result: ProviderResult): void {
    this.selected = result;
  }

  close(): void {
    this.selected = null;
  }

  download(result: ProviderResult): void {
    this.service.downloadResult(result);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
