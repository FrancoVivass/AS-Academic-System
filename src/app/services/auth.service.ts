import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'gestion_academica_auth';
  private readonly USUARIOS_KEY = 'gestion_academica_usuarios';
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers(): void {
    const usuarios = this.getUsuarios();
    if (usuarios.length === 0) {
      const defaultUsers: Usuario[] = [
        {
          id: '1',
          username: 'admin',
          password: '1234',
          nombre: 'Administrador',
          apellido: 'Sistema',
          email: 'admin@academia.edu',
          rol: 'admin',
          fechaRegistro: new Date().toISOString(),
          activo: true
        },
        {
          id: '2',
          username: 'profesor',
          password: '1234',
          nombre: 'Profesor',
          apellido: 'Demo',
          email: 'profesor@academia.edu',
          rol: 'profesor',
          fechaRegistro: new Date().toISOString(),
          activo: true
        }
      ];
      localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(defaultUsers));
    }
  }

  login(username: string, password: string): boolean {
    const usuarios = this.getUsuarios();
    const usuario = usuarios.find(u => u.username === username && u.password === password);
    
    if (usuario) {
      const { password: _, ...userWithoutPassword } = usuario;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
      this.currentUserSubject.next(userWithoutPassword as Usuario);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.getStoredUser() !== null;
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  private getStoredUser(): Usuario | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  getUsuarios(): Usuario[] {
    const stored = localStorage.getItem(this.USUARIOS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getUsuariosByRol(rol: string): Usuario[] {
    return this.getUsuarios().filter(u => u.rol === rol && u.activo);
  }

  getUsuarioById(id: string): Usuario | undefined {
    return this.getUsuarios().find(u => u.id === id);
  }

  updateUser(user: Usuario): void {
    const usuarios = this.getUsuarios();
    const index = usuarios.findIndex(u => u.id === user.id);
    if (index !== -1) {
      usuarios[index] = user;
      localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(usuarios));
      
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === user.id) {
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
        this.currentUserSubject.next(userWithoutPassword as Usuario);
      }
    }
  }
}

