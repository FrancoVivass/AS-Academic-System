import { Component, AfterViewInit } from '@angular/core';
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
  ngAfterViewInit() {
    // Cargar el script del encabezado
    this.loadScript();
    this.initMobileMenu();
    this.initScrollBehavior();
  }

  private loadScript() {
    const script = document.createElement('script');
    script.src = '/assets/js/script.encabezado.js';
    script.async = true;
    document.body.appendChild(script);
  }

  private initMobileMenu() {
    const menuButton = document.querySelector('.link-col-mobile');
    const closeButton = document.querySelector('.close-button p');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (menuButton && closeButton && mobileOverlay && mobileMenu) {
      menuButton.addEventListener('click', () => {
        mobileOverlay.classList.add('show');
        mobileMenu.classList.add('show');
      });

      closeButton.addEventListener('click', () => {
        mobileOverlay.classList.remove('show');
        mobileMenu.classList.remove('show');
      });

      mobileOverlay.addEventListener('click', (event) => {
        if (event.target === mobileOverlay) {
          mobileOverlay.classList.remove('show');
          mobileMenu.classList.remove('show');
        }
      });
    }
  }

  private initScrollBehavior() {
    let prevScroll = window.pageYOffset;
    window.onscroll = () => {
      let curScroll = window.pageYOffset;
      const headerElement = document.getElementsByClassName('header')[0] as HTMLElement;
      if (headerElement) {
        if (prevScroll > curScroll) {
          headerElement.style.top = '0';
        } else {
          headerElement.style.top = '-25vh';
        }
      }
      prevScroll = curScroll;
    };
  }
}
