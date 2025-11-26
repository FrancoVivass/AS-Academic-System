import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Docente } from '../models/usuario.model';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private readonly STORAGE_KEY = 'gestion_academica_docentes';
  private useSupabase = true;
  private docentesSubject = new BehaviorSubject<Docente[]>([]);
  public docentes$ = this.docentesSubject.asObservable();

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadDocentes();
  }

  private async loadDocentes(): Promise<void> {
    if (this.useSupabase) {
      try {
        const docentes = await this.getDocentesFromSupabase();
        this.docentesSubject.next(docentes);
      } catch (error) {
        const docentes = this.getDocentesFromStorage();
        this.docentesSubject.next(docentes);
      }
    } else {
      const docentes = this.getDocentesFromStorage();
      this.docentesSubject.next(docentes);
    }
  }

  private async getDocentesFromSupabase(): Promise<Docente[]> {
    const { data: docentesData, error } = await this.supabase.client
      .from('docentes')
      .select(`
        *,
        usuarios:usuarios(*),
        materias:docente_materias(materia_id)
      `);

    if (error) throw error;

    return (docentesData || []).map((db: any) => {
      const usuario = db.usuarios;
      return {
        id: db.id,
        username: usuario?.username || '',
        password: usuario?.password || '',
        nombre: usuario?.nombre || '',
        apellido: usuario?.apellido || '',
        email: usuario?.email || '',
        telefono: usuario?.telefono || '',
        dni: usuario?.dni || '',
        rol: 'profesor' as const,
        especialidad: db.especialidad,
        materiasAsignadas: (db.materias || []).map((m: any) => m.materia_id),
        fechaRegistro: usuario?.fecha_registro,
        activo: usuario?.activo !== false
      };
    });
  }

  private getDocentesFromStorage(): Docente[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getDocentes(): Promise<Docente[]> {
    if (this.useSupabase) {
      try {
        return await this.getDocentesFromSupabase();
      } catch (error) {
        return this.getDocentesFromStorage();
      }
    }
    return this.getDocentesFromStorage();
  }

  async getDocenteById(id: string): Promise<Docente | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('docentes')
          .select(`
            *,
            usuarios:usuarios(*),
            materias:docente_materias(materia_id)
          `)
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        const usuario = data.usuarios;
        return {
          id: data.id,
          username: usuario?.username || '',
          password: usuario?.password || '',
          nombre: usuario?.nombre || '',
          apellido: usuario?.apellido || '',
          email: usuario?.email || '',
          telefono: usuario?.telefono || '',
          dni: usuario?.dni || '',
          rol: 'profesor' as const,
          especialidad: data.especialidad,
          materiasAsignadas: (data.materias || []).map((m: any) => m.materia_id),
          fechaRegistro: usuario?.fecha_registro,
          activo: usuario?.activo !== false
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getDocentesFromStorage().find(d => d.id === id);
  }

  async addDocente(docente: Docente): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        // Crear usuario primero
        const usuarioData = {
          id: docente.id,
          username: docente.username,
          password: docente.password,
          nombre: docente.nombre,
          apellido: docente.apellido,
          email: docente.email,
          telefono: docente.telefono,
          dni: docente.dni,
          rol: 'profesor',
          institucion_id: currentInstitucion.id, // Asignar institución actual
          fecha_registro: docente.fechaRegistro || new Date().toISOString(),
          activo: docente.activo !== false
        };

        await this.supabase.create('usuarios', usuarioData);

        // Crear docente
        await this.supabase.create('docentes', {
          id: docente.id,
          especialidad: docente.especialidad
        });

        // Agregar materias asignadas
        if (docente.materiasAsignadas && docente.materiasAsignadas.length > 0) {
          for (const materiaId of docente.materiasAsignadas) {
            try {
              await this.supabase.create('docente_materias', {
                docente_id: docente.id,
                materia_id: materiaId
              });
            } catch (error: any) {
              // Ignorar duplicados
            }
          }
        }

        await this.loadDocentes();
      } catch (error) {
        console.error('Error agregando docente:', error);
        throw error;
      }
    } else {
      const docentes = this.getDocentesFromStorage();
      docentes.push(docente);
      this.saveDocentesToStorage(docentes);
      
      // También crear usuario usando registerUser
      const usuarios = await this.authService.getUsuarios();
      const usuarioExistente = usuarios.find(u => u.id === docente.id || u.username === docente.username);
      if (!usuarioExistente) {
        const result = await this.authService.registerUser({
          username: docente.username,
          password: docente.password,
          nombre: docente.nombre,
          apellido: docente.apellido,
          email: docente.email,
          telefono: docente.telefono,
          dni: docente.dni,
          rol: 'profesor'
        });
        if (!result.success) {
          throw new Error(result.error || 'Error al crear el usuario');
        }
      }
    }
  }

  async updateDocente(docente: Docente): Promise<void> {
    if (this.useSupabase) {
      try {
        // Actualizar usuario
        await this.supabase.update('usuarios', docente.id, {
          nombre: docente.nombre,
          apellido: docente.apellido,
          email: docente.email,
          telefono: docente.telefono,
          dni: docente.dni
        });

        // Actualizar docente
        await this.supabase.update('docentes', docente.id, {
          especialidad: docente.especialidad
        });

        // Actualizar materias asignadas
        if (docente.materiasAsignadas) {
          // Eliminar todas las materias existentes
          const { data: existentes } = await this.supabase.client
            .from('docente_materias')
            .select('id')
            .eq('docente_id', docente.id);

          for (const existente of existentes || []) {
            await this.supabase.delete('docente_materias', existente.id);
          }

          // Agregar las nuevas
          for (const materiaId of docente.materiasAsignadas) {
            try {
              await this.supabase.create('docente_materias', {
                docente_id: docente.id,
                materia_id: materiaId
              });
            } catch (error: any) {
              // Ignorar errores
            }
          }
        }

        await this.loadDocentes();
      } catch (error) {
        console.error('Error actualizando docente:', error);
        throw error;
      }
    } else {
      const docentes = this.getDocentesFromStorage();
      const index = docentes.findIndex(d => d.id === docente.id);
      if (index !== -1) {
        docentes[index] = docente;
        this.saveDocentesToStorage(docentes);
      }
    }
  }

  async deleteDocente(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        // Las foreign keys con ON DELETE CASCADE eliminarán automáticamente
        await this.supabase.delete('usuarios', id);
        await this.loadDocentes();
      } catch (error) {
        console.error('Error eliminando docente:', error);
        throw error;
      }
    } else {
      const docentes = this.getDocentesFromStorage().filter(d => d.id !== id);
      this.saveDocentesToStorage(docentes);
    }
  }

  async getDocentesByMateria(materiaId: string): Promise<Docente[]> {
    const docentes = await this.getDocentes();
    return docentes.filter(d => d.materiasAsignadas?.includes(materiaId));
  }

  private saveDocentesToStorage(docentes: Docente[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(docentes));
    this.docentesSubject.next(docentes);
  }
}
