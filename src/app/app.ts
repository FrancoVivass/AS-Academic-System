import { Component, OnInit } from '@angular/core';
import { RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, Event } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { LoadingNeonComponent } from './components/loading-neon/loading-neon.component';
import { GlobalWidgetsComponent } from './components/global-widgets/global-widgets.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MatSnackBarModule, LoadingNeonComponent, GlobalWidgetsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'Gestión Académica';

  constructor(
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Mostrar loading durante navegación
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.loadingService.show();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Pequeño delay para que se vea el efecto
        setTimeout(() => {
          this.loadingService.hide();
        }, 500);
      }
    });
  }
}
