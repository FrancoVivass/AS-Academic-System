import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EncabezadoPrincipal } from '../encabezado-principal/encabezado-principal';
import { FooterPrincipal } from '../footer-principal/footer-principal';

@Component({
  selector: 'app-como-funciona',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, EncabezadoPrincipal, FooterPrincipal],
  templateUrl: './como-funciona.html',
  styleUrl: './como-funciona.css'
})
export class ComoFuncionaComponent implements OnInit {
  isDarkMode = false;
  showScrollTop = false;
  whatsappNumber = '5491112345678';
  whatsappMessage = 'Hola, me interesa conocer más sobre AcademicSystem';

  ngOnInit(): void {
    // Scroll al inicio cuando se carga la página
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
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

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openWhatsApp(): void {
    const message = encodeURIComponent(this.whatsappMessage);
    const url = `https://wa.me/${this.whatsappNumber}?text=${message}`;
    window.open(url, '_blank');
  }
}






