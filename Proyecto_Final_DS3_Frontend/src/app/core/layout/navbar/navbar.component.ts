import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: `
    <header class="navbar">
      <span class="brand">MULTI-AI STUDIO</span>
      <a routerLink="/auth/login">Salir</a>
    </header>
  `,
})
export class NavbarComponent {}
