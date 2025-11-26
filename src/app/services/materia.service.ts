import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Materia, AlumnoMateria } from '../models/materia.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class MateriaService {
  private readonly STORAGE_KEY = 'gestion_academica_materias';
  private readonly INSCRIPCIONES_KEY = 'gestion_academica_inscripciones';
  private useSupabase = true;
  private materiasSubject = new BehaviorSubject<Materia[]>([]);
  public materias$ = this.materiasSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadMaterias();
  }

  private async loadMaterias(): Promise<void> {
    if (this.useSupabase) {
      try {
        const materias = await this.getMateriasFromSupabase();
        this.materiasSubject.next(materias);
      } catch (error) {
        const materias = this.getMateriasFromStorage();
        this.materiasSubject.next(materias);
      }
    } else {
      const materias = this.getMateriasFromStorage();
      this.materiasSubject.next(materias);
    }
  }

  private async getMateriasFromSupabase(): Promise<Materia[]> {
    console.log('getMateriasFromSupabase - Iniciando consulta...');
    
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      console.log('getMateriasFromSupabase - No hay institución seleccionada');
      return [];
    }
    
    // Filtrar materias por institución
    const { data, error } = await this.supabase.client
      .from('materias')
      .select(`
        *,
        correlatividades:materia_correlatividades(materia_correlativa_id)
      `)
      .eq('institucion_id', currentInstitucion.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo materias (con correlatividades):', error);
      // Si hay error con correlatividades, intentar sin ellas
      const { data: dataSimple, error: errorSimple } = await this.supabase.client
        .from('materias')
        .select('*')
        .eq('institucion_id', currentInstitucion.id)
        .order('nombre', { ascending: true });
      
      if (errorSimple) {
        console.error('Error obteniendo materias (sin correlatividades):', errorSimple);
        return [];
      }
      
      console.log('getMateriasFromSupabase - Materias obtenidas (sin correlatividades):', dataSimple?.length || 0);
      return (dataSimple || []).map((db: any) => this.mapMateriaFromDb(db));
    }
    
    const dataFinal = data || [];
    console.log('getMateriasFromSupabase - Materias obtenidas:', dataFinal.length);

    return dataFinal.map((db: any) => this.mapMateriaFromDb(db));
  }

  private mapMateriaFromDb(db: any): Materia {
    // Manejar correlatividades de diferentes formas
    let correlatividades: string[] = [];
    if (db.correlatividades) {
      if (Array.isArray(db.correlatividades)) {
        // Si es un array de objetos con materia_correlativa_id
        correlatividades = db.correlatividades
          .map((c: any) => c.materia_correlativa_id || c)
          .filter((id: any) => id); // Filtrar valores nulos/undefined
      } else if (typeof db.correlatividades === 'string') {
        // Si es un string (array serializado)
        try {
          correlatividades = JSON.parse(db.correlatividades);
        } catch {
          correlatividades = [];
        }
      }
    }
    
    return {
      id: db.id,
      nombre: db.nombre || '',
      codigo: db.codigo || '',
      descripcion: db.descripcion || '',
      profesor: db.profesor || '', // Nombre del profesor (puede estar vacío)
      curso: db.curso || '', // Nombre del curso (puede estar vacío)
      horario: db.horario || '', // Horario (puede estar vacío)
      creditos: db.creditos || 0,
      horasSemanales: db.horas_semanales || 0,
      carreraId: db.carrera_id || '', // Puede estar vacío inicialmente
      correlatividades: correlatividades,
      tipo: db.tipo || 'obligatoria',
      estado: db.estado || 'activa',
      fechaCreacion: db.fecha_creacion || new Date().toISOString(),
      cuatrimestre: db.cuatrimestre,
      año: db.año,
      configuracion: {
        tieneNota: db.tiene_nota !== false,
        tieneAsistencia: db.tiene_asistencia !== false,
        requiereAprobacion: db.requiere_aprobacion || false,
        notaMinimaAprobacion: db.nota_minima_aprobacion || 6,
        porcentajeAsistenciaMinimo: db.porcentaje_asistencia_minimo || 75
      }
    };
  }

  private getMateriasFromStorage(): Materia[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getMaterias(): Promise<Materia[]> {
    if (this.useSupabase) {
      try {
        const materias = await this.getMateriasFromSupabase();
        console.log('getMaterias - Materias obtenidas de Supabase:', materias.length);
        return materias;
      } catch (error) {
        console.error('Error obteniendo materias de Supabase:', error);
        const materiasStorage = this.getMateriasFromStorage();
        console.log('getMaterias - Usando materias de localStorage:', materiasStorage.length);
        return materiasStorage;
      }
    }
    const materiasStorage = this.getMateriasFromStorage();
    console.log('getMaterias - Usando localStorage (useSupabase=false):', materiasStorage.length);
    return materiasStorage;
  }

  async getMateriaById(id: string): Promise<Materia | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('materias')
          .select(`
            *,
            correlatividades:materia_correlatividades(materia_correlativa_id)
          `)
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        return {
          id: data.id,
          nombre: data.nombre,
          codigo: data.codigo,
          descripcion: data.descripcion,
          profesor: data.profesor || '',
          curso: data.curso || '',
          horario: data.horario || '',
          creditos: data.creditos || 0,
          horasSemanales: data.horas_semanales,
          carreraId: data.carrera_id || '',
          correlatividades: (data.correlatividades || []).map((c: any) => c.materia_correlativa_id),
          tipo: data.tipo || 'obligatoria',
          estado: data.estado || 'activa',
          fechaCreacion: data.fecha_creacion,
          cuatrimestre: data.cuatrimestre,
          año: data.año,
          configuracion: {
            tieneNota: data.tiene_nota !== false,
            tieneAsistencia: data.tiene_asistencia !== false,
            requiereAprobacion: data.requiere_aprobacion || false,
            notaMinimaAprobacion: data.nota_minima_aprobacion || 6,
            porcentajeAsistenciaMinimo: data.porcentaje_asistencia_minimo || 75
          }
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getMateriasFromStorage().find(m => m.id === id);
  }

  async addMateria(materia: Materia): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        await this.supabase.create('materias', {
          id: materia.id,
          nombre: materia.nombre,
          codigo: materia.codigo,
          descripcion: materia.descripcion || null,
          profesor: materia.profesor || null, // Nombre del profesor (opcional)
          curso: materia.curso || null, // Nombre del curso (opcional)
          horario: materia.horario || null, // Horario (opcional)
          creditos: materia.creditos || 0,
          horas_semanales: materia.horasSemanales || null,
          carrera_id: materia.carreraId || null, // Opcional, se puede asignar después
          institucion_id: currentInstitucion.id, // REQUERIDO: Asignar institución actual
          tipo: materia.tipo || 'obligatoria',
          estado: materia.estado || 'activa',
          cuatrimestre: materia.cuatrimestre || null,
          año: materia.año || null,
          tiene_nota: materia.configuracion?.tieneNota !== false,
          tiene_asistencia: materia.configuracion?.tieneAsistencia !== false,
          requiere_aprobacion: materia.configuracion?.requiereAprobacion || false,
          nota_minima_aprobacion: materia.configuracion?.notaMinimaAprobacion || 6,
          porcentaje_asistencia_minimo: materia.configuracion?.porcentajeAsistenciaMinimo || 75,
          fecha_creacion: materia.fechaCreacion || new Date().toISOString()
        });

        // Agregar correlatividades
        if (materia.correlatividades && materia.correlatividades.length > 0) {
          for (const corrId of materia.correlatividades) {
            try {
              await this.supabase.create('materia_correlatividades', {
                materia_id: materia.id,
                materia_correlativa_id: corrId
              });
            } catch (error: any) {
              // Ignorar duplicados
            }
          }
        }

        await this.loadMaterias(); // Recargar materias después de agregar
      } catch (error) {
        console.error('Error agregando materia:', error);
        throw error;
      }
    } else {
      const materias = this.getMateriasFromStorage();
      materias.push(materia);
      this.saveMateriasToStorage(materias);
      this.materiasSubject.next(materias);
    }
  }

  async updateMateria(materia: Materia): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        await this.supabase.update('materias', materia.id, {
          nombre: materia.nombre,
          codigo: materia.codigo,
          descripcion: materia.descripcion || null,
          profesor: materia.profesor || null, // Nombre del profesor (opcional)
          curso: materia.curso || null, // Nombre del curso (opcional)
          horario: materia.horario || null, // Horario (opcional)
          creditos: materia.creditos || 0,
          horas_semanales: materia.horasSemanales || null,
          carrera_id: materia.carreraId || null, // Opcional
          institucion_id: currentInstitucion.id, // Mantener institución actual
          tipo: materia.tipo || 'obligatoria',
          estado: materia.estado || 'activa',
          cuatrimestre: materia.cuatrimestre || null,
          año: materia.año || null,
          tiene_nota: materia.configuracion?.tieneNota !== false,
          tiene_asistencia: materia.configuracion?.tieneAsistencia !== false,
          requiere_aprobacion: materia.configuracion?.requiereAprobacion || false,
          nota_minima_aprobacion: materia.configuracion?.notaMinimaAprobacion || 6,
          porcentaje_asistencia_minimo: materia.configuracion?.porcentajeAsistenciaMinimo || 75
        });

        // Actualizar correlatividades
        if (materia.correlatividades) {
          // Eliminar todas las correlatividades existentes
          const { data: existentes } = await this.supabase.client
            .from('materia_correlatividades')
            .select('id')
            .eq('materia_id', materia.id);

          for (const existente of existentes || []) {
            await this.supabase.delete('materia_correlatividades', existente.id);
          }

          // Agregar las nuevas
          for (const corrId of materia.correlatividades) {
            try {
              await this.supabase.create('materia_correlatividades', {
                materia_id: materia.id,
                materia_correlativa_id: corrId
              });
            } catch (error: any) {
              // Ignorar errores
            }
          }
        }

        await this.loadMaterias();
      } catch (error) {
        console.error('Error actualizando materia:', error);
        throw error;
      }
    } else {
      const materias = this.getMateriasFromStorage();
      const index = materias.findIndex(m => m.id === materia.id);
      if (index !== -1) {
        materias[index] = materia;
        this.saveMateriasToStorage(materias);
        this.materiasSubject.next(materias);
      }
    }
  }

  async deleteMateria(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('materias', id);
        await this.loadMaterias();
      } catch (error) {
        console.error('Error eliminando materia:', error);
        throw error;
      }
    } else {
      const materias = this.getMateriasFromStorage().filter(m => m.id !== id);
      this.saveMateriasToStorage(materias);
      this.materiasSubject.next(materias);
    }
  }

  private saveMateriasToStorage(materias: Materia[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(materias));
  }

  // Inscripciones (se mantiene en localStorage por ahora)
  getInscripciones(): AlumnoMateria[] {
    const stored = localStorage.getItem(this.INSCRIPCIONES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getInscripcionesByMateria(materiaId: string): AlumnoMateria[] {
    return this.getInscripciones().filter(i => i.materiaId === materiaId);
  }

  getInscripcionesByAlumno(alumnoId: string): AlumnoMateria[] {
    return this.getInscripciones().filter(i => i.alumnoId === alumnoId);
  }

  inscribirAlumno(inscripcion: AlumnoMateria): void {
    const inscripciones = this.getInscripciones();
    const existe = inscripciones.some(
      i => i.alumnoId === inscripcion.alumnoId && i.materiaId === inscripcion.materiaId
    );
    if (!existe) {
      inscripciones.push(inscripcion);
      localStorage.setItem(this.INSCRIPCIONES_KEY, JSON.stringify(inscripciones));
    }
  }

  desinscribirAlumno(alumnoId: string, materiaId: string): void {
    const inscripciones = this.getInscripciones().filter(
      i => !(i.alumnoId === alumnoId && i.materiaId === materiaId)
    );
    localStorage.setItem(this.INSCRIPCIONES_KEY, JSON.stringify(inscripciones));
  }
}
