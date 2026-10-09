import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { ToastComponent } from './components/shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  template: `
    <app-navbar *ngIf="!isAdminRoute"></app-navbar>
    <app-toast></app-toast>
    <main [class.admin-shell]="isAdminRoute">
      <router-outlet></router-outlet>
    </main>
    <app-footer *ngIf="!isAdminRoute"></app-footer>
  `,
  styles: [`
    main { min-height: 70vh; }
    main.admin-shell { min-height: 100vh; }
  `]
})
export class AppComponent {
  isAdminRoute = false;

  constructor(private readonly router: Router) {
    this.updateShell(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateShell(event.urlAfterRedirects));
  }

  private updateShell(url: string): void {
    this.isAdminRoute = url === '/admin' || url.startsWith('/admin/');
  }
}
