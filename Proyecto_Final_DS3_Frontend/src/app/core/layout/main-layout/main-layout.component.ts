import { Component } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  template: `
    <app-navbar></app-navbar>
    <div class="layout-body">
      <app-sidebar></app-sidebar>
      <main class="layout-content">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-footer></app-footer>
  `,
})
export class MainLayoutComponent {}
