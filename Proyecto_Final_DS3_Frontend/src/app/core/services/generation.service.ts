import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GenerationRequest, GenerationResponse, ProviderResult
} from '../models/generation.models';
import { MockGenerationBackend } from './mock-generation.backend';

@Injectable({ providedIn: 'root' })
export class GenerationService {
  private http = inject(HttpClient);
  private mock = new MockGenerationBackend();

  private readonly baseUrl = `${environment.apiUrl}/generations`;

  /** POST /api/generations -> crea la generación; los resultados nacen en PENDING. */
  create(request: GenerationRequest): Observable<GenerationResponse> {
    return environment.useMock
      ? this.mock.create(request)
      : this.http.post<GenerationResponse>(this.baseUrl, request);
  }

  /** GET /api/generations/{id}/results -> estado actual de cada proveedor. */
  getResults(generationId: number): Observable<ProviderResult[]> {
    return environment.useMock
      ? this.mock.getResults(generationId)
      : this.http.get<ProviderResult[]>(`${this.baseUrl}/${generationId}/results`);
  }

  /** GET /api/generations/results/{id}/download (con JWT por el interceptor). */
  downloadResult(result: ProviderResult): void {
    if (result.simulated) {
      this.downloadSimulated(result);
      return;
    }
    this.http
      .get(`${this.baseUrl}/results/${result.id}/download`, { responseType: 'blob' })
      .subscribe({
        next: blob => this.save(blob, this.fileName(result)),
        error: () => alert('No se pudo descargar el archivo.')
      });
  }

  private downloadSimulated(result: ProviderResult): void {
    const code = result.providerCode.toLowerCase();
    if (result.mediaType === 'IMAGE' && result.contentUrl) {
      const svg = decodeURIComponent(result.contentUrl.split(',')[1]);
      this.save(new Blob([svg], { type: 'image/svg+xml' }), `${code}-ejemplo.svg`);
    } else {
      const text = result.textContent ?? 'Archivo de ejemplo simulado.';
      this.save(new Blob([text], { type: 'text/plain' }), `${code}-ejemplo.txt`);
    }
  }

  private fileName(result: ProviderResult): string {
    const ext = { IMAGE: 'png', VIDEO: 'mp4', AUDIO: 'mp3', TEXT: 'txt' }[result.mediaType];
    return `${result.providerCode.toLowerCase()}-${result.id}.${ext}`;
  }

  private save(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
