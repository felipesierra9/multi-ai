import { Component } from '@angular/core';

@Component({
  selector: 'app-generator',
  standalone: false,
  template: `
    <div class="page">
      <h2>Generador multimedia</h2>
      <p>Aquí irán el prompt, el selector de tipo y las 4 tarjetas (Fase F5).</p>
      <app-result-card providerName="IA 1" status="PENDING"></app-result-card>
    </div>
  `,
})
export class GeneratorComponent {}
