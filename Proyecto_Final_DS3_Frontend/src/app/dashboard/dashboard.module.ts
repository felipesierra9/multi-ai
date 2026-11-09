import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { GeneratorComponent } from './components/generator/generator.component';
import { HistoryComponent } from './components/history/history.component';
import { ProfileComponent } from './components/profile/profile.component';

@NgModule({
  declarations: [DashboardComponent, GeneratorComponent, HistoryComponent, ProfileComponent],
  imports: [SharedModule, DashboardRoutingModule],
})
export class DashboardModule {}
