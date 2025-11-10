import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'gestion_academica_theme';
  private themeSubject = new BehaviorSubject<'light' | 'dark'>(this.getStoredTheme());
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.getStoredTheme());
  }

  getTheme(): 'light' | 'dark' {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    const newTheme = this.getTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);
    this.themeSubject.next(theme);
  }

  private getStoredTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return (stored as 'light' | 'dark') || 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}

