import { Component, Input } from '@angular/core';

export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

@Component({
  selector: 'app-result-card',
  standalone: false,
  template: `
    <div class="card">
      <h3>{{ providerName }}</h3>
      <p>Estado: {{ status }}</p>
    </div>
  `,
})
export class ResultCardComponent {
  @Input() providerName = 'Proveedor IA';
  @Input() status: GenerationStatus = 'PENDING';
}
