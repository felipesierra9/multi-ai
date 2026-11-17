import { Component, Input } from '@angular/core';
import { ChartPoint } from '../../core/models/admin.models';

/** Gráfica de barras simple (HTML + CSS), sin librerías externas. */
@Component({
  selector: 'app-bar-chart',
  standalone: false,
  template: `
    <div class="chart">
      <h3>{{ title }}</h3>

      @if (data.length === 0) {
        <p class="muted">Sin datos para mostrar.</p>
      } @else if (orientation === 'vertical') {
        <div class="chart-v">
          @for (p of data; track p.label) {
            <div class="chart-v__col" [title]="p.label + ': ' + p.value">
              <span class="chart-v__value">{{ p.value }}</span>
              <div class="chart-v__area">
                <div class="chart-v__bar" [style.height.%]="percent(p.value)"></div>
              </div>
              <span class="chart-v__label">{{ p.label }}</span>
            </div>
          }
        </div>
      } @else {
        <div class="chart-h">
          @for (p of data; track p.label) {
            <div class="chart-h__row">
              <span class="chart-h__label">{{ p.label }}</span>
              <div class="chart-h__track">
                <div class="chart-h__bar" [style.width.%]="percent(p.value)"></div>
              </div>
              <span class="chart-h__value">{{ p.value }}</span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class BarChartComponent {
  @Input() title = '';
  @Input() data: ChartPoint[] = [];
  @Input() orientation: 'vertical' | 'horizontal' = 'horizontal';

  get max(): number {
    return this.data.reduce((m, p) => Math.max(m, p.value), 0);
  }

  percent(value: number): number {
    return this.max ? (value / this.max) * 100 : 0;
  }
}
