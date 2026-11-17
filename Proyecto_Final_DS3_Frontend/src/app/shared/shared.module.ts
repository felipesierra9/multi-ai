import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResultCardComponent } from './result-card/result-card.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';

/**
 * SharedModule: piezas reutilizables por varios módulos.
 * Cada módulo funcional lo importa cuando lo necesite.
 */
@NgModule({
  declarations: [ResultCardComponent, BarChartComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, ResultCardComponent, BarChartComponent]
})
export class SharedModule { }
