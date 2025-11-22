import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollLockService {
  private scrollPosition: number = 0;

  lockScroll(): void {
    // Guardar la posición actual del scroll
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Bloquear el scroll del body
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
  }

  unlockScroll(): void {
    // Restaurar el scroll del body
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // Restaurar la posición del scroll
    window.scrollTo(0, this.scrollPosition);
    
    // Resetear la posición guardada
    this.scrollPosition = 0;
  }
}

