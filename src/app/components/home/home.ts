import { Component, AfterViewInit, OnDestroy, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EncabezadoPrincipal } from '../encabezado-principal/encabezado-principal';
import { FooterPrincipal } from '../footer-principal/footer-principal';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, EncabezadoPrincipal, FooterPrincipal],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;
  scrollProgress = 0;
  isDarkMode = false;
  selectedPlan = 'basic';

  plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 'Gratis',
      features: [
        'Hasta 100 alumnos',
        'Gestión de asistencia',
        'Reportes básicos',
        'Soporte por email'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Profesional',
      price: '$99/mes',
      features: [
        'Alumnos ilimitados',
        'Todas las funcionalidades',
        'Reportes avanzados',
        'Soporte prioritario',
        'Integraciones API',
        'Personalización de marca'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      price: 'Personalizado',
      features: [
        'Todo del plan Profesional',
        'Múltiples instituciones',
        'Soporte 24/7',
        'Capacitación personalizada',
        'SLA garantizado',
        'Cuenta dedicada'
      ],
      popular: false
    }
  ];

  socialLinks = {
    facebook: 'https://facebook.com/academicsystem',
    twitter: 'https://twitter.com/academicsystem',
    linkedin: 'https://linkedin.com/company/academicsystem',
    instagram: 'https://instagram.com/academicsystem'
  };

  whatsappNumber = '5491112345678'; // Reemplazar con tu número
  whatsappMessage = 'Hola, me interesa conocer más sobre AcademicSystem';


  // Galería de screenshots
  currentScreenshotIndex = 0;
  showLightbox = false;
  screenshots = [
    { src: '/assets/img/cover.png', title: 'Dashboard Principal', description: 'Vista general del panel de control' },
    { src: '/assets/img/cover.png', title: 'Gestión de Alumnos', description: 'Administración completa de estudiantes' },
    { src: '/assets/img/cover.png', title: 'Reportes y Estadísticas', description: 'Análisis detallado de datos' }
  ];

  // Timeline
  timelineSteps = [
    { step: 1, title: 'Consulta Inicial', description: 'Contacto y evaluación de necesidades', duration: '1 día', completed: true },
    { step: 2, title: 'Configuración', description: 'Personalización de la plataforma', duration: '3-5 días', completed: true },
    { step: 3, title: 'Capacitación', description: 'Entrenamiento del equipo', duration: '2-3 días', completed: false },
    { step: 4, title: 'Lanzamiento', description: 'Puesta en marcha del sistema', duration: '1 día', completed: false }
  ];

  // Clima
  weatherData: any = null;
  weatherLoading = true;

  // Scroll to top
  showScrollTop = false;

  // Social widget collapse
  isSocialCollapsed = false;

  ngOnInit(): void {
    // Cargar preferencia de modo oscuro
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }
    
    // Verificar cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    this.cookiesAccepted = cookiesAccepted === 'true' || cookiesAccepted === 'false';
  }

  ngAfterViewInit(): void {
    this.initScrollReveal();
    this.initScrollProgress();
    this.initWeatherWidget();
    this.initScrollToTop();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    window.removeEventListener('scroll', this.updateScrollProgress);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollProgress();
    this.showScrollTop = window.pageYOffset > 300;
  }

  updateScrollProgress(): void {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = window.pageYOffset;
    this.scrollProgress = (scrolled / windowHeight) * 100;
  }

  initScrollProgress(): void {
    this.updateScrollProgress();
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

  shareOnSocial(platform: string): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Conoce AcademicSystem - Plataforma de gestión académica');
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  selectPlan(planId: string): void {
    this.selectedPlan = planId;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openLightbox(index: number): void {
    this.currentScreenshotIndex = index;
    this.showLightbox = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.showLightbox = false;
    document.body.style.overflow = '';
  }

  nextScreenshot(): void {
    this.currentScreenshotIndex = (this.currentScreenshotIndex + 1) % this.screenshots.length;
  }

  prevScreenshot(): void {
    this.currentScreenshotIndex = (this.currentScreenshotIndex - 1 + this.screenshots.length) % this.screenshots.length;
  }


  cookiesAccepted = false;

  acceptCookies(): void {
    localStorage.setItem('cookiesAccepted', 'true');
    this.cookiesAccepted = true;
  }

  rejectCookies(): void {
    localStorage.setItem('cookiesAccepted', 'false');
    this.cookiesAccepted = true;
  }

  private initScrollReveal(): void {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach(el => this.observer?.observe(el));
  }


  private initWeatherWidget(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          // Usar API de OpenWeatherMap (necesitarás una API key)
          // Por ahora simulamos datos
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

  toggleSocialCollapse(): void {
    this.isSocialCollapsed = !this.isSocialCollapsed;
  }
}
