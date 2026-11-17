import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { GenerationSummary, MediaType, ProviderResult } from '../../../core/models/generation.models';
import { GenerationService } from '../../../core/services/generation.service';

@Component({
  selector: 'app-history',
  standalone: false,
  template: `
    <div class="page">
      <h2>Historial</h2>

      @if (useMock) {
        <div class="alert alert-warn">
          Modo simulado: solo aparecen las generaciones que hiciste en esta sesión del navegador
          y se pierden al recargar la página.
        </div>
      }

      <div class="filters">
        <input type="text" placeholder="Buscar en tus prompts..." [(ngModel)]="search" />
        <select [(ngModel)]="filterType">
          <option value="ALL">Todos los tipos</option>
          <option value="IMAGE">Imagen</option>
          <option value="VIDEO">Video</option>
          <option value="AUDIO">Audio</option>
          <option value="TEXT">Texto</option>
        </select>
      </div>

      @if (loading) {
        <div class="spinner"></div>
      } @else if (error) {
        <div class="alert alert-error">{{ error }}</div>
      } @else if (filtered.length === 0) {
        <p class="muted">No hay generaciones para mostrar. Crea una en el Generador.</p>
      } @else {
        @for (item of filtered; track item.id) {
          <div class="card history-item">
            <div class="history-item__head">
              <div>
                <strong>{{ typeLabels[item.mediaType] }}</strong>
                <span class="muted"> · {{ item.createdAt | date: 'medium' }}</span>
                @if (item.simulated) {
                  <span class="tag-sim">SIMULADO</span>
                }
              </div>
              <button type="button" class="btn btn-small" (click)="toggle(item)">
                {{ openId === item.id ? 'Ocultar' : 'Ver resultados' }}
              </button>
            </div>
            <p class="history-prompt">{{ item.prompt }}</p>
            <span class="muted">{{ item.completedCount }} de {{ item.totalCount }} completados</span>

            @if (openId === item.id) {
              @if (loadingResults) {
                <div class="spinner"></div>
              } @else {
                <div class="results-grid">
                  @for (r of openResults; track r.id) {
                    <app-result-card
                      [providerName]="r.providerName"
                      [result]="r"
                      (viewResult)="open($event)"
                      (downloadResult)="download($event)">
                    </app-result-card>
                  }
                </div>
              }
            }
          </div>
        }
      }
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
export class HistoryComponent implements OnInit {
  private service = inject(GenerationService);
  private cdr = inject(ChangeDetectorRef);

  readonly useMock = environment.useMock;
  readonly typeLabels: Record<MediaType, string> = {
    IMAGE: 'Imagen',
    VIDEO: 'Video',
    AUDIO: 'Audio',
    TEXT: 'Texto'
  };

  items: GenerationSummary[] = [];
  loading = true;
  error = '';

  search = '';
  filterType: MediaType | 'ALL' = 'ALL';

  openId: number | null = null;
  openResults: ProviderResult[] = [];
  loadingResults = false;
  selected: ProviderResult | null = null;

  ngOnInit(): void {
    this.service.list().subscribe({
      next: items => {
        this.items = items;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : 'No se pudo cargar el historial.';
        this.cdr.markForCheck();
      }
    });
  }

  get filtered(): GenerationSummary[] {
    const q = this.search.trim().toLowerCase();
    return this.items.filter(item =>
      (this.filterType === 'ALL' || item.mediaType === this.filterType) &&
      (!q || item.prompt.toLowerCase().includes(q))
    );
  }

  toggle(item: GenerationSummary): void {
    if (this.openId === item.id) {
      this.openId = null;
      return;
    }
    this.openId = item.id;
    this.openResults = [];
    this.loadingResults = true;

    this.service.getResults(item.id).subscribe({
      next: results => {
        this.openResults = results;
        this.loadingResults = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingResults = false;
        this.error = 'No se pudieron cargar los resultados.';
        this.cdr.markForCheck();
      }
    });
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
}
