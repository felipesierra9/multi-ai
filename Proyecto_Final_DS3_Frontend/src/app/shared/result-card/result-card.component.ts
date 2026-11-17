import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GenerationStatus, ProviderResult } from '../../core/models/generation.models';

@Component({
  selector: 'app-result-card',
  standalone: false,
  template: `
    <div class="result-card">
      <div class="result-card__head">
        <div class="provider-badge">{{ badge }}</div>
        <div class="result-card__title">
          <strong>{{ result?.providerName ?? providerName }}</strong>
          <span class="status" [attr.data-status]="status">{{ statusLabel }}</span>
        </div>
        @if (result?.simulated) {
          <span class="tag-sim">SIMULADO</span>
        }
      </div>

      <div class="result-card__body">
        @switch (status) {
          @case ('IDLE') {
            <p class="muted">Esperando un prompt...</p>
          }
          @case ('PENDING') {
            <div class="spinner"></div>
            <p class="muted">En cola...</p>
          }
          @case ('PROCESSING') {
            <div class="spinner"></div>
            <p class="muted">Generando...</p>
          }
          @case ('FAILED') {
            <p class="error">{{ result?.errorMessage || 'Este proveedor no respondió.' }}</p>
          }
          @case ('COMPLETED') {
            @if (result; as r) {
              @if (r.mediaType === 'IMAGE' && r.contentUrl) {
                <img [src]="r.contentUrl" alt="Resultado generado" />
              } @else if (r.mediaType === 'VIDEO' && r.contentUrl) {
                <video [src]="r.contentUrl" controls></video>
              } @else if (r.mediaType === 'AUDIO' && r.contentUrl) {
                <audio [src]="r.contentUrl" controls></audio>
              } @else {
                <pre class="text-preview">{{ r.textContent || 'Resultado listo.' }}</pre>
              }
            }
          }
        }
      </div>

      <div class="result-card__foot">
        <span class="muted">{{ durationText }}</span>
        <div class="result-card__actions">
          <button type="button" class="btn btn-small" [disabled]="status !== 'COMPLETED'"
                  (click)="result && viewResult.emit(result)">Visualizar</button>
          <button type="button" class="btn btn-small" [disabled]="status !== 'COMPLETED'"
                  (click)="result && downloadResult.emit(result)">Descargar</button>
        </div>
      </div>
    </div>
  `
})
export class ResultCardComponent {
  @Input() providerName = 'Proveedor IA';
  @Input() badge = 'IA';
  @Input() result: ProviderResult | null = null;

  @Output() viewResult = new EventEmitter<ProviderResult>();
  @Output() downloadResult = new EventEmitter<ProviderResult>();

  get status(): GenerationStatus | 'IDLE' {
    return this.result?.status ?? 'IDLE';
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      IDLE: 'En espera',
      PENDING: 'En cola',
      PROCESSING: 'Procesando',
      COMPLETED: 'Completado',
      FAILED: 'Falló'
    };
    return labels[this.status];
  }

  get durationText(): string {
    const ms = this.result?.durationMs;
    return ms ? `Tiempo: ${(ms / 1000).toFixed(1)} s` : '';
  }
}
