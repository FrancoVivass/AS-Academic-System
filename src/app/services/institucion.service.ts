import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Institucion } from '../models/institucion.model';

@Injectable({
  providedIn: 'root'
})
export class InstitucionService {
  private readonly STORAGE_KEY = 'gestion_academica_instituciones';
  private readonly CURRENT_INSTITUCION_KEY = 'gestion_academica_institucion_actual';
  private institucionesSubject = new BehaviorSubject<Institucion[]>(this.getInstituciones());
  private currentInstitucionSubject = new BehaviorSubject<Institucion | null>(this.getCurrentInstitucion());
  
  public instituciones$ = this.institucionesSubject.asObservable();
  public currentInstitucion$ = this.currentInstitucionSubject.asObservable();

  constructor() {
    this.initializeDefaultInstituciones();
    // Aplicar colores de la institución actual si existe
    const currentInstitucion = this.getCurrentInstitucion();
    if (currentInstitucion) {
      // Actualizar la institución actual con los datos más recientes
      const institucionesActualizadas = this.getInstituciones();
      const institucionActual = institucionesActualizadas.find(i => i.id === currentInstitucion.id);
      if (institucionActual) {
        this.setCurrentInstitucion(institucionActual);
      } else {
        this.updateCSSVariables(currentInstitucion);
      }
    }
  }

  private initializeDefaultInstituciones(): void {
    const instituciones = this.getInstituciones();
    
    // Definir instituciones por defecto
    const defaultInstituciones: Institucion[] = [
      {
        id: '1',
        nombre: 'Instituto Paula Robles',
        nombreCorto: 'IPR',
        logo: 'assets/instituciones/paula-robles-logo.png',
        descripcion: 'Instituto Superior Paula Robles',
        colorPrimario: '#800020',
        colorSecundario: '#722F37',
        colorAcento: '#FFFFFF',
        email: 'contacto@paulorobles.edu',
        telefono: '+54 11 1234-5678',
        direccion: 'Av. Principal 123, Buenos Aires',
        activa: true,
        credencialSecreta: 'EDI2025',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: '2',
        nombre: 'Colegio San Patricio',
        nombreCorto: 'CSP',
        logo: 'assets/instituciones/csp-logo.png',
        descripcion: 'Colegio privado con educación integral',
        colorPrimario: '#2e7d32',
        colorSecundario: '#1b5e20',
        colorAcento: '#4caf50',
        email: 'info@sanpatricio.edu',
        telefono: '+54 11 2345-6789',
        direccion: 'Calle Educación 456, Córdoba',
        activa: true,
        credencialSecreta: 'CSP2024',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      },
      {
        id: '3',
        nombre: 'Academia de Ciencias',
        nombreCorto: 'AC',
        logo: 'assets/instituciones/ac-logo.png',
        descripcion: 'Academia especializada en ciencias exactas',
        colorPrimario: '#7b1fa2',
        colorSecundario: '#6a1b9a',
        colorAcento: '#9c27b0',
        email: 'contacto@academiadeciencias.edu',
        telefono: '+54 11 3456-7890',
        direccion: 'Boulevard Científico 789, Rosario',
        activa: true,
        credencialSecreta: 'AC2024',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      }
    ];

    if (instituciones.length === 0) {
      // Si no hay instituciones, crear las por defecto
      this.saveInstituciones(defaultInstituciones);
    } else {
      let necesitaGuardar = false;
      
      // Siempre actualizar la institución con ID '1' para asegurar que tenga los datos correctos
      const institucionActualizada = defaultInstituciones.find(i => i.id === '1');
      const index = instituciones.findIndex(i => i.id === '1');
      
      if (institucionActualizada) {
        if (index !== -1) {
          const institucionExistente = instituciones[index];
          // Mantener la fecha de creación original si existe
          institucionActualizada.fechaCreacion = institucionExistente.fechaCreacion || institucionActualizada.fechaCreacion;
          
          // Verificar si hay cambios antes de actualizar
          if (institucionExistente.nombre !== institucionActualizada.nombre || 
              institucionExistente.descripcion !== institucionActualizada.descripcion ||
              institucionExistente.logo !== institucionActualizada.logo ||
              institucionExistente.colorPrimario !== institucionActualizada.colorPrimario) {
            // Actualizar la institución
            instituciones[index] = { ...institucionActualizada };
            necesitaGuardar = true;
            
            // Si esta institución está seleccionada actualmente, actualizarla también
            const currentInstitucion = this.getCurrentInstitucion();
            if (currentInstitucion && currentInstitucion.id === '1') {
              this.setCurrentInstitucion(instituciones[index]);
            }
          }
        } else {
          // Si no existe la institución con ID '1', agregarla
          instituciones.push(institucionActualizada);
          necesitaGuardar = true;
        }
      }
      
      // Asegurarse de que todas las instituciones por defecto existan
      defaultInstituciones.forEach(defaultInst => {
        const existe = instituciones.find(i => i.id === defaultInst.id);
        if (!existe) {
          instituciones.push(defaultInst);
          necesitaGuardar = true;
        }
      });
      
      // Guardar solo si hubo cambios
      if (necesitaGuardar) {
        this.saveInstituciones(instituciones);
      }
    }
  }
  
  // Método público para forzar la actualización de instituciones
  refreshInstituciones(): void {
    this.initializeDefaultInstituciones();
    const instituciones = this.getInstituciones();
    this.institucionesSubject.next(instituciones);
  }

  getInstituciones(): Institucion[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getInstitucionById(id: string): Institucion | undefined {
    return this.getInstituciones().find(i => i.id === id);
  }

  getInstitucionActiva(): Institucion[] {
    return this.getInstituciones().filter(i => i.activa);
  }

  setCurrentInstitucion(institucion: Institucion): void {
    localStorage.setItem(this.CURRENT_INSTITUCION_KEY, JSON.stringify(institucion));
    this.currentInstitucionSubject.next(institucion);
    this.updateCSSVariables(institucion);
    // También actualizar los colores del header
    this.applyInstitucionColors(institucion);
  }

  private applyInstitucionColors(institucion: Institucion): void {
    // Los colores ya se aplican mediante CSS variables
    // Este método puede usarse para lógica adicional si es necesario
  }

  getCurrentInstitucion(): Institucion | null {
    const stored = localStorage.getItem(this.CURRENT_INSTITUCION_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  clearCurrentInstitucion(): void {
    localStorage.removeItem(this.CURRENT_INSTITUCION_KEY);
    this.currentInstitucionSubject.next(null);
    this.resetCSSVariables();
  }

  verificarCredencial(institucionId: string, credencial: string): boolean {
    const institucion = this.getInstitucionById(institucionId);
    return institucion ? institucion.credencialSecreta === credencial : false;
  }

  addInstitucion(institucion: Institucion): void {
    const instituciones = this.getInstituciones();
    instituciones.push(institucion);
    this.saveInstituciones(instituciones);
  }

  updateInstitucion(institucion: Institucion): void {
    const instituciones = this.getInstituciones();
    const index = instituciones.findIndex(i => i.id === institucion.id);
    if (index !== -1) {
      instituciones[index] = { ...institucion, fechaActualizacion: new Date().toISOString() };
      this.saveInstituciones(instituciones);
      if (this.getCurrentInstitucion()?.id === institucion.id) {
        this.setCurrentInstitucion(instituciones[index]);
      }
    }
  }

  deleteInstitucion(id: string): void {
    const instituciones = this.getInstituciones().filter(i => i.id !== id);
    this.saveInstituciones(instituciones);
  }

  private saveInstituciones(instituciones: Institucion[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(instituciones));
    this.institucionesSubject.next(instituciones);
  }

  private updateCSSVariables(institucion: Institucion): void {
    const root = document.documentElement;
    root.style.setProperty('--institucion-primary', institucion.colorPrimario);
    root.style.setProperty('--institucion-secondary', institucion.colorSecundario);
    root.style.setProperty('--institucion-accent', institucion.colorAcento);
  }

  private resetCSSVariables(): void {
    const root = document.documentElement;
    root.style.removeProperty('--institucion-primary');
    root.style.removeProperty('--institucion-secondary');
    root.style.removeProperty('--institucion-accent');
  }
}

