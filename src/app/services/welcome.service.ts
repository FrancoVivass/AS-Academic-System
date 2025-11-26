import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class WelcomeService {
  private readonly STORAGE_KEY_PREFIX = 'welcome_shown_';

  /**
   * Verifica si el usuario ya vio el modal de bienvenida
   */
  hasSeenWelcome(userId: string): boolean {
    const key = this.getStorageKey(userId);
    return localStorage.getItem(key) === 'true';
  }

  /**
   * Marca que el usuario ya vio el modal de bienvenida
   */
  markWelcomeAsSeen(userId: string): void {
    const key = this.getStorageKey(userId);
    localStorage.setItem(key, 'true');
  }

  /**
   * Resetea el estado de bienvenida (útil para testing)
   */
  resetWelcome(userId: string): void {
    const key = this.getStorageKey(userId);
    localStorage.removeItem(key);
  }

  /**
   * Obtiene la clave de almacenamiento para un usuario
   */
  private getStorageKey(userId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${userId}`;
  }

  /**
   * Verifica si el usuario debe ver el modal de bienvenida
   */
  shouldShowWelcome(user: Usuario | null): boolean {
    if (!user) return false;
    return !this.hasSeenWelcome(user.id);
  }
}

