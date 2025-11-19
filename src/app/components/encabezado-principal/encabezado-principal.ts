import { Component, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-encabezado-principal',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, MatButtonModule, MatDividerModule],
  templateUrl: './encabezado-principal.html',
  styleUrl: './encabezado-principal.css'
})
export class EncabezadoPrincipal implements AfterViewInit {
  isScrolled = false;

  ngAfterViewInit() {
    this.initMobileMenu();
    this.updateScrollState();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  private initMobileMenu() {
    // Usar setTimeout para asegurar que el DOM esté listo
    setTimeout(() => {
      const menuButton = document.querySelector('.link-col-mobile') || document.querySelector('.menu-button') || document.getElementById('menuButton');
      const closeButton = document.querySelector('.close-button p') || document.getElementById('closeButton');
      const mobileOverlay = document.querySelector('.mobile-overlay') || document.getElementById('mobileOverlay');
      const mobileMenu = document.querySelector('.mobile-menu') || document.getElementById('mobileMenu');

      if (menuButton && closeButton && mobileOverlay && mobileMenu) {
        menuButton.addEventListener('click', () => {
          (mobileOverlay as HTMLElement).classList.add('show');
          (mobileMenu as HTMLElement).classList.add('show');
          document.body.style.overflow = 'hidden';
        });

        closeButton.addEventListener('click', () => {
          (mobileOverlay as HTMLElement).classList.remove('show');
          (mobileMenu as HTMLElement).classList.remove('show');
          document.body.style.overflow = '';
        });

        mobileOverlay.addEventListener('click', (event) => {
          if (event.target === mobileOverlay) {
            (mobileOverlay as HTMLElement).classList.remove('show');
            (mobileMenu as HTMLElement).classList.remove('show');
            document.body.style.overflow = '';
          }
        });
      }
    }, 100);
  }

  private updateScrollState(): void {
    this.isScrolled = window.scrollY > 10;
  }
}
