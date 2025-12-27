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
  showWidgets = false; // Por defecto oculto, se verifica en ngOnInit

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
    // Verificar inmediatamente la ruta actual
    this.checkRoute();
    
    // Suscribirse a cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkRoute();
    });

    // Cargar preferencia de modo oscuro solo si NO estamos en gestión
    // Esto se hace después de checkRoute para asegurar que showWidgets esté correcto
    setTimeout(() => {
      if (this.showWidgets) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          this.isDarkMode = true;
          document.documentElement.classList.add('dark-mode');
          document.body.classList.add('dark-mode');
        }
      }
    }, 0);
  }

  ngAfterViewInit(): void {
    // Solo inicializar clima si NO estamos en gestión
    if (this.showWidgets) {
      this.initWeatherWidget();
    }
    this.initScrollToTop();
  }

  private checkRoute(): void {
    const currentUrl = this.router.url;
    // Rutas donde se ocultan widgets (excepto WhatsApp): gestión y login
    const isInGestion = currentUrl.startsWith('/app') || currentUrl.includes('/app/');
    const isInLogin = currentUrl.startsWith('/login') || currentUrl === '/login';
    const shouldHideWidgets = isInGestion || isInLogin;
    
    // Ocultar widgets (excepto WhatsApp) si estamos en gestión o login
    // WhatsApp siempre se muestra, pero el resto solo fuera de estas rutas
    const previousShowWidgets = this.showWidgets;
    this.showWidgets = !shouldHideWidgets;
    
    // Si estamos en gestión o login, limpiar y ocultar clima
    if (shouldHideWidgets) {
      this.weatherData = null;
      this.weatherLoading = false;
      // Asegurar que no se muestren los widgets
      if (previousShowWidgets !== this.showWidgets) {
        console.log('🔒 Ocultando widgets:', currentUrl);
      }
    } else {
      // Si NO estamos en estas rutas y no hay datos de clima, inicializar
      if (!this.weatherData && this.weatherLoading) {
        this.initWeatherWidget();
      }
      if (previousShowWidgets !== this.showWidgets) {
        console.log('✅ Mostrando widgets:', currentUrl);
      }
    }
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
    this.weatherLoading = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lon = position.coords.longitude;
          const lat = position.coords.latitude;
          // API Key de OpenWeatherMap
          const apiKey = '10b09c14bc0b62c8b063d4bd63a88997';
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;

          fetch(url)
            .then(response => response.json())
            .then(data => {
              const temp = Math.round(data.main.temp);
              const desc = data.weather[0].description;
              const location = data.name;
              const weatherMain = data.weather[0].main;

              // Determinar el icono según el tipo de clima
              let iconName = 'cloudy-day-1.svg'; // Por defecto
              
              switch (weatherMain) {
                case 'Thunderstorm':
                  iconName = 'thunder.svg';
                  break;
                case 'Drizzle':
                  iconName = 'rainy-2.svg';
                  break;
                case 'Rain':
                  iconName = 'rainy-7.svg';
                  break;
                case 'Snow':
                  iconName = 'snowy-6.svg';
                  break;
                case 'Clear':
                  iconName = 'day.svg';
                  break;
                case 'Atmosphere':
                  iconName = 'weather.svg';
                  break;
                case 'Clouds':
                  iconName = 'cloudy-day-1.svg';
                  break;
                default:
                  iconName = 'cloudy-day-1.svg';
              }

              this.weatherData = {
                temp: temp,
                description: desc.toUpperCase(),
                location: location,
                icon: iconName,
                windSpeed: data.wind?.speed || 0
              };
              this.weatherLoading = false;
            })
            .catch(error => {
              console.error('Error al obtener datos del clima:', error);
              // Datos por defecto en caso de error
              this.weatherData = {
                temp: 22,
                description: 'Parcialmente nublado',
                location: 'Buenos Aires',
                icon: 'cloudy-day-1.svg'
              };
              this.weatherLoading = false;
            });
        },
        (error) => {
          console.error('Error de geolocalización:', error);
          // Si falla la geolocalización, usar datos por defecto
          this.weatherData = {
            temp: 22,
            description: 'Parcialmente nublado',
            location: 'Buenos Aires',
            icon: 'cloudy-day-1.svg'
          };
          this.weatherLoading = false;
        }
      );
    } else {
      // Si no hay soporte de geolocalización, usar datos por defecto
      this.weatherData = {
        temp: 22,
        description: 'Parcialmente nublado',
        location: 'Buenos Aires',
        icon: 'cloudy-day-1.svg'
      };
      this.weatherLoading = false;
    }
  }

  private initScrollToTop(): void {
    this.showScrollTop = window.pageYOffset > 300;
  }
}


