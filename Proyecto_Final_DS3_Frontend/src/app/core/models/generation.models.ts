export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT';
export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface GenerationRequest {
  prompt: string;
  mediaType: MediaType;
}

export interface ProviderResult {
  id: number;
  providerCode: string;
  providerName: string;
  status: GenerationStatus;
  mediaType: MediaType;
  contentUrl?: string | null;
  textContent?: string | null;
  errorMessage?: string | null;
  durationMs?: number | null;
  /** true cuando el resultado viene del modo simulado (no es de una IA real). */
  simulated?: boolean;
}

export interface GenerationResponse {
  id: number;
  prompt: string;
  mediaType: MediaType;
  results: ProviderResult[];
}

/** Fila del historial: una generación con su conteo de resultados. */
export interface GenerationSummary {
  id: number;
  prompt: string;
  mediaType: MediaType;
  createdAt: string;
  completedCount: number;
  totalCount: number;
  simulated?: boolean;
}
