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



  // Galería de screenshots
  currentScreenshotIndex = 0;
  showLightbox = false;
  screenshots = [
    { src: '/assets/img/dashboard.png', title: 'Dashboard Principal', description: 'Vista general del panel de control' },
    { src: '/assets/img/AlumnosGestion.png', title: 'Gestión de Alumnos', description: 'Administración completa de estudiantes' },
    { src: '/assets/img/reportes.png', title: 'Reportes y Estadísticas', description: 'Análisis detallado de datos' }
  ];

  // Timeline
  timelineSteps = [
    { step: 1, title: 'Consulta Inicial', description: 'Contacto y evaluación de necesidades', duration: '1 día', completed: true },
    { step: 2, title: 'Configuración', description: 'Personalización de la plataforma', duration: '3-5 días', completed: true },
    { step: 3, title: 'Creacion de modelo', description: 'Dedicado a que vos me digas como crearlo', duration: '2-3 días', completed: true },
    { step: 4, title: 'Implementacion', description: 'Imprementar los requerimientos', duration: '7 días', completed: true },
    { step: 5, title: 'Capacitación', description: 'Entrenamiento del equipo', duration: '2-3 días', completed: false },
    { step: 6, title: 'Lanzamiento', description: 'Puesta en marcha del sistema', duration: '1 día', completed: false }
  ];

  // Scroll to top
  showScrollTop = false;

  ngOnInit(): void {
    // Scroll al inicio cuando se carga la página
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  ngAfterViewInit(): void {
    this.initScrollReveal();
    this.initScrollProgress();
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




  private initScrollToTop(): void {
    this.showScrollTop = window.pageYOffset > 300;
  }
}
