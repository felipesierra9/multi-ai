import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { FooterComponent } from './layout/footer/footer.component';

/**
 * CoreModule: servicios y componentes que existen UNA sola vez en toda la app.
 * Se importa únicamente en AppModule.
 */
@NgModule({
  declarations: [MainLayoutComponent, NavbarComponent, SidebarComponent, FooterComponent],
  imports: [CommonModule, RouterModule],
  exports: [MainLayoutComponent],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule | null) {
    if (parentModule) {
      throw new Error('CoreModule ya fue cargado. Impórtalo solo en AppModule.');
    }
  }
}
