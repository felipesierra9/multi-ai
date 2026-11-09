import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  template: `<footer class="footer">MULTI-AI STUDIO © {{ year }} · Universidad El Bosque</footer>`,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
