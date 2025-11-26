import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-global-widgets',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './global-widgets.component.html',
  styleUrl: './global-widgets.component.css'
})
export class GlobalWidgetsComponent implements OnInit, AfterViewInit {
  isDarkMode = false;
  showScrollTop = false;
  isSocialCollapsed = false;
  weatherData: any = null;
  weatherLoading = true;
  showWidgets = true; // Por defecto visible

  socialLinks = {
    facebook: 'https://www.facebook.com/academicsystem',
    twitter: 'https://twitter.com/academicsystem',
    linkedin: 'https://linkedin.com/company/academicsystem',
    instagram: 'https://instagram.com/academicsystem'
  };

  whatsappNumber = '542245421367';
  whatsappMessage = 'Hola, me interesa conocer más sobre AcademicSystem';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Verificar si estamos en la ruta de gestión (/app/*)
    this.checkRoute();
    
    // Suscribirse a cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkRoute();
    });

    // Cargar preferencia de modo oscuro
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }
  }

  ngAfterViewInit(): void {
    this.initWeatherWidget();
    this.initScrollToTop();
  }

  private checkRoute(): void {
    const currentUrl = this.router.url;
    // Ocultar widgets si estamos en la gestión (/app/*)
    this.showWidgets = !currentUrl.startsWith('/app');
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showScrollTop = window.pageYOffset > 300;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  openWhatsApp(): void {
    const message = encodeURIComponent(this.whatsappMessage);
    const url = `https://wa.me/${this.whatsappNumber}?text=${message}`;
    window.open(url, '_blank');
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleSocialCollapse(): void {
    this.isSocialCollapsed = !this.isSocialCollapsed;
  }

  private initWeatherWidget(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simular datos de clima
          this.weatherData = {
            temp: 22,
            description: 'Parcialmente nublado',
            location: 'Buenos Aires',
            icon: 'cloudy-day-1'
          };
          this.weatherLoading = false;
        },
        () => {
          // Si falla la geolocalización, usar datos por defecto
          this.weatherData = {
            temp: 22,
            description: 'Parcialmente nublado',
            location: 'Buenos Aires',
            icon: 'cloudy-day-1'
          };
          this.weatherLoading = false;
        }
      );
    } else {
      this.weatherData = {
        temp: 22,
        description: 'Parcialmente nublado',
        location: 'Buenos Aires',
        icon: 'cloudy-day-1'
      };
      this.weatherLoading = false;
    }
  }

  private initScrollToTop(): void {
    this.showScrollTop = window.pageYOffset > 300;
  }
}


