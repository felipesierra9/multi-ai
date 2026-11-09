import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuditComponent } from './components/audit/audit.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { ReportsComponent } from './components/reports/reports.component';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    UserManagementComponent,
    AuditComponent,
    StatisticsComponent,
    ReportsComponent,
  ],
  imports: [SharedModule, AdminRoutingModule],
})
export class AdminModule {}
