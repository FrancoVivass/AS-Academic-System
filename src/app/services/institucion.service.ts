import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Institucion } from '../models/institucion.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class InstitucionService {
  private readonly STORAGE_KEY = 'gestion_academica_instituciones';
  private readonly CURRENT_INSTITUCION_KEY = 'gestion_academica_institucion_actual';
  private useSupabase = true; // Cambiar a false para usar localStorage temporalmente
  private institucionesSubject = new BehaviorSubject<Institucion[]>([]);
  private currentInstitucionSubject = new BehaviorSubject<Institucion | null>(this.getCurrentInstitucionFromStorage());
  
  public instituciones$ = this.institucionesSubject.asObservable();
  public currentInstitucion$ = this.currentInstitucionSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.loadInstituciones();
    // Aplicar colores de la institución actual si existe
    const currentInstitucion = this.getCurrentInstitucionFromStorage();
    if (currentInstitucion) {
      this.updateCSSVariables(currentInstitucion);
    }
  }

  private async loadInstituciones(): Promise<void> {
    if (this.useSupabase) {
      try {
        const instituciones = await this.getInstitucionesFromSupabase();
        this.institucionesSubject.next(instituciones);
        // Si no hay instituciones, inicializar las por defecto
        if (instituciones.length === 0) {
          await this.initializeDefaultInstituciones();
        }
      } catch (error) {
        console.error('Error cargando instituciones desde Supabase:', error);
        // Fallback a localStorage
        const instituciones = this.getInstitucionesFromStorage();
        this.institucionesSubject.next(instituciones);
        if (instituciones.length === 0) {
          this.initializeDefaultInstitucionesSync();
        }
      }
    } else {
      const instituciones = this.getInstitucionesFromStorage();
      this.institucionesSubject.next(instituciones);
      if (instituciones.length === 0) {
        this.initializeDefaultInstitucionesSync();
      }
    }
  }

  private async getInstitucionesFromSupabase(): Promise<Institucion[]> {
    const { data, error } = await this.supabase.client
      .from('instituciones')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;

    return (data || []).map((db: any) => this.mapDbToInstitucion(db));
  }

  private mapDbToInstitucion(db: any): Institucion {
    return {
      id: db.id,
      nombre: db.nombre,
      nombreCorto: db.nombre_corto,
      logo: db.logo,
      descripcion: db.descripcion,
      colorPrimario: db.color_primario,
      colorSecundario: db.color_secundario,
      colorAcento: db.color_acento,
      email: db.email,
      telefono: db.telefono,
      direccion: db.direccion,
      activa: db.activa,
      credencialSecreta: db.credencial_secreta,
      fechaCreacion: db.fecha_creacion,
      fechaActualizacion: db.fecha_actualizacion
    };
  }

  private mapInstitucionToDb(inst: Institucion): any {
    return {
      id: inst.id,
      nombre: inst.nombre,
      nombre_corto: inst.nombreCorto,
      logo: inst.logo,
      descripcion: inst.descripcion,
      color_primario: inst.colorPrimario,
      color_secundario: inst.colorSecundario,
      color_acento: inst.colorAcento,
      email: inst.email,
      telefono: inst.telefono,
      direccion: inst.direccion,
      activa: inst.activa,
      credencial_secreta: inst.credencialSecreta,
      fecha_creacion: inst.fechaCreacion,
      fecha_actualizacion: inst.fechaActualizacion || new Date().toISOString()
    };
  }

  private getInstitucionesFromStorage(): Institucion[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private getCurrentInstitucionFromStorage(): Institucion | null {
    const stored = localStorage.getItem(this.CURRENT_INSTITUCION_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private async initializeDefaultInstituciones(): Promise<void> {
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

    if (this.useSupabase) {
      for (const inst of defaultInstituciones) {
        try {
          const existing = await this.supabase.client
            .from('instituciones')
            .select('id')
            .eq('id', inst.id)
            .single();

          if (!existing.data) {
            await this.supabase.create('instituciones', this.mapInstitucionToDb(inst));
          }
        } catch (error: any) {
          // Ignorar si ya existe
        }
      }
      await this.loadInstituciones();
    } else {
      this.initializeDefaultInstitucionesSync();
    }
  }

  private initializeDefaultInstitucionesSync(): void {
    const instituciones = this.getInstitucionesFromStorage();
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
      }
    ];

    if (instituciones.length === 0) {
      this.saveInstitucionesToStorage(defaultInstituciones);
      this.institucionesSubject.next(defaultInstituciones);
    }
  }
  
  async refreshInstituciones(): Promise<void> {
    await this.loadInstituciones();
  }

  async getInstituciones(): Promise<Institucion[]> {
    if (this.useSupabase) {
      return await this.getInstitucionesFromSupabase();
    } else {
      return this.getInstitucionesFromStorage();
    }
  }

  async getInstitucionById(id: string): Promise<Institucion | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('instituciones')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data ? this.mapDbToInstitucion(data) : undefined;
      } catch (error) {
        console.error('Error obteniendo institución:', error);
        return undefined;
      }
    } else {
      return this.getInstitucionesFromStorage().find(i => i.id === id);
    }
  }

  async getInstitucionActiva(): Promise<Institucion[]> {
    const instituciones = await this.getInstituciones();
    return instituciones.filter(i => i.activa);
  }

  setCurrentInstitucion(institucion: Institucion): void {
    localStorage.setItem(this.CURRENT_INSTITUCION_KEY, JSON.stringify(institucion));
    this.currentInstitucionSubject.next(institucion);
    this.updateCSSVariables(institucion);
  }

  getCurrentInstitucion(): Institucion | null {
    return this.getCurrentInstitucionFromStorage();
  }

  clearCurrentInstitucion(): void {
    localStorage.removeItem(this.CURRENT_INSTITUCION_KEY);
    this.currentInstitucionSubject.next(null);
    this.resetCSSVariables();
  }

  async verificarCredencial(institucionId: string, credencial: string): Promise<boolean> {
    const institucion = await this.getInstitucionById(institucionId);
    return institucion ? institucion.credencialSecreta === credencial : false;
  }

  async addInstitucion(institucion: Institucion): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.create('instituciones', this.mapInstitucionToDb(institucion));
        await this.loadInstituciones();
      } catch (error) {
        console.error('Error agregando institución:', error);
        throw error;
      }
    } else {
      const instituciones = this.getInstitucionesFromStorage();
      instituciones.push(institucion);
      this.saveInstitucionesToStorage(instituciones);
      this.institucionesSubject.next(instituciones);
    }
  }

  async updateInstitucion(institucion: Institucion): Promise<void> {
    if (this.useSupabase) {
      try {
        const updated = { ...institucion, fechaActualizacion: new Date().toISOString() };
        await this.supabase.update('instituciones', institucion.id, this.mapInstitucionToDb(updated));
        await this.loadInstituciones();
        
        if (this.getCurrentInstitucion()?.id === institucion.id) {
          this.setCurrentInstitucion(updated);
        }
      } catch (error) {
        console.error('Error actualizando institución:', error);
        throw error;
      }
    } else {
      const instituciones = this.getInstitucionesFromStorage();
      const index = instituciones.findIndex(i => i.id === institucion.id);
      if (index !== -1) {
        instituciones[index] = { ...institucion, fechaActualizacion: new Date().toISOString() };
        this.saveInstitucionesToStorage(instituciones);
        this.institucionesSubject.next(instituciones);
        if (this.getCurrentInstitucion()?.id === institucion.id) {
          this.setCurrentInstitucion(instituciones[index]);
        }
      }
    }
  }

  async deleteInstitucion(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('instituciones', id);
        await this.loadInstituciones();
      } catch (error) {
        console.error('Error eliminando institución:', error);
        throw error;
      }
    } else {
      const instituciones = this.getInstitucionesFromStorage().filter(i => i.id !== id);
      this.saveInstitucionesToStorage(instituciones);
      this.institucionesSubject.next(instituciones);
    }
  }

  private saveInstitucionesToStorage(instituciones: Institucion[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(instituciones));
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

