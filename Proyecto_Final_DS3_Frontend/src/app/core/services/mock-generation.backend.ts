import { Observable, of } from 'rxjs';
import {
  GenerationRequest, GenerationResponse, GenerationSummary, MediaType, ProviderResult
} from '../models/generation.models';

/**
 * MODO SIMULADO (solo para desarrollar la interfaz sin backend).
 * No llama a ninguna IA. Los resultados son marcadores de ejemplo y se marcan como "simulated".
 * Se desactiva poniendo useMock: false en environment.ts.
 */
interface MockProvider {
  code: string;
  name: string;
  delayMs: number;
  fails: boolean;
}

const MOCK_PROVIDERS: MockProvider[] = [
  { code: 'PROVIDER_1', name: 'Proveedor IA 1', delayMs: 2500, fails: false },
  { code: 'PROVIDER_2', name: 'Proveedor IA 2', delayMs: 4500, fails: false },
  { code: 'PROVIDER_3', name: 'Proveedor IA 3', delayMs: 7000, fails: false },
  { code: 'PROVIDER_4', name: 'Proveedor IA 4', delayMs: 5500, fails: true }
];

interface MockGeneration {
  startedAt: number;
  prompt: string;
  mediaType: MediaType;
}

export class MockGenerationBackend {
  private nextId = 1;
  private generations = new Map<number, MockGeneration>();

  create(request: GenerationRequest): Observable<GenerationResponse> {
    const id = this.nextId++;
    this.generations.set(id, {
      startedAt: Date.now(),
      prompt: request.prompt,
      mediaType: request.mediaType
    });
    return of({
      id,
      prompt: request.prompt,
      mediaType: request.mediaType,
      results: this.build(id)
    });
  }

  getResults(id: number): Observable<ProviderResult[]> {
    return of(this.build(id));
  }

  /** Historial: solo las generaciones hechas en esta sesión (en memoria). */
  list(): Observable<GenerationSummary[]> {
    const items: GenerationSummary[] = [];
    this.generations.forEach((gen, id) => {
      const results = this.build(id);
      items.push({
        id,
        prompt: gen.prompt,
        mediaType: gen.mediaType,
        createdAt: new Date(gen.startedAt).toISOString(),
        completedCount: results.filter(r => r.status === 'COMPLETED').length,
        totalCount: results.length,
        simulated: true
      });
    });
    return of(items.sort((a, b) => b.id - a.id));
  }

  private build(id: number): ProviderResult[] {
    const gen = this.generations.get(id);
    if (!gen) {
      return [];
    }
    const elapsed = Date.now() - gen.startedAt;

    return MOCK_PROVIDERS.map((p, index): ProviderResult => {
      const base: ProviderResult = {
        id: id * 10 + index,
        providerCode: p.code,
        providerName: p.name,
        mediaType: gen.mediaType,
        status: 'PENDING',
        simulated: true
      };
      if (elapsed < 800) {
        return base;
      }
      if (elapsed < p.delayMs) {
        return { ...base, status: 'PROCESSING' };
      }
      if (p.fails) {
        return {
          ...base,
          status: 'FAILED',
          errorMessage: 'El proveedor no respondió a tiempo (error simulado).'
        };
      }
      return { ...base, status: 'COMPLETED', durationMs: p.delayMs, ...this.content(p, gen) };
    });
  }

  private content(provider: MockProvider, gen: MockGeneration): Partial<ProviderResult> {
    switch (gen.mediaType) {
      case 'IMAGE':
        return { contentUrl: this.placeholderImage(provider.name) };
      case 'TEXT':
        return {
          textContent:
            '[TEXTO DE EJEMPLO SIMULADO - no fue generado por una IA]\n\nPrompt recibido: ' + gen.prompt
        };
      default:
        return { textContent: 'Vista previa no disponible en modo simulado.' };
    }
  }

  private placeholderImage(providerName: string): string {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400">' +
      '<rect width="100%" height="100%" fill="#262b55"/>' +
      '<text x="50%" y="45%" fill="#e8eaf6" font-family="sans-serif" font-size="28" text-anchor="middle">IMAGEN DE EJEMPLO</text>' +
      '<text x="50%" y="58%" fill="#9aa0c3" font-family="sans-serif" font-size="18" text-anchor="middle">' +
      providerName + ' - simulado</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
}
