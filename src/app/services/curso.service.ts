import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Curso, HorarioCurso } from '../models/curso.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private readonly STORAGE_KEY = 'gestion_academica_cursos';
  private useSupabase = true;
  private cursosSubject = new BehaviorSubject<Curso[]>([]);
  public cursos$ = this.cursosSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadCursos();
  }

  private async loadCursos(): Promise<void> {
    if (this.useSupabase) {
      try {
        const cursos = await this.getCursosFromSupabase();
        this.cursosSubject.next(cursos);
      } catch (error) {
        const cursos = this.getCursosFromStorage();
        this.cursosSubject.next(cursos);
      }
    } else {
      const cursos = this.getCursosFromStorage();
      this.cursosSubject.next(cursos);
    }
  }

  private async getCursosFromSupabase(): Promise<Curso[]> {
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    // Filtrar cursos por institución a través de carreras
    const { data, error } = await this.supabase.client
      .from('cursos')
      .select(`
        *,
        horarios:curso_horarios(*),
        materias:curso_materias(materia_id),
        alumnos:alumno_cursos(alumno_id),
        carrera:carreras!inner(institucion_id)
      `)
      .eq('carrera.institucion_id', currentInstitucion.id)
      .order('año', { ascending: true });

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      carreraId: db.carrera_id,
      nombre: db.nombre,
      codigo: db.codigo,
      año: db.año,
      division: db.division,
      turno: db.turno,
      capacidad: db.capacidad,
      cupoMaximo: db.cupo_maximo,
      cupoActual: db.cupo_actual || 0,
      tutorId: db.tutor_id,
      horarios: (db.horarios || []).map((h: any) => ({
        id: h.id,
        dia: h.dia,
        horaInicio: h.hora_inicio,
        horaFin: h.hora_fin,
        materiaId: h.materia_id,
        docenteId: h.docente_id,
        aula: h.aula_id
      })),
      materias: (db.materias || []).map((m: any) => m.materia_id),
      alumnos: (db.alumnos || []).map((a: any) => a.alumno_id),
      listaEspera: [], // Se obtiene de alumno_cursos con estado 'en_lista_espera'
      estado: db.estado || 'activo',
      modalidad: db.modalidad,
      aulaId: db.aula_id,
      cuatrimestre: db.cuatrimestre,
      fechaInicio: db.fecha_inicio,
      fechaFin: db.fecha_fin,
      fechaCreacion: db.fecha_creacion,
      configuracion: {
        permiteAutoinscripcion: db.permite_autoinscripcion || false,
        permiteEdicionHorariosProfesor: db.permite_edicion_horarios_profesor || false,
        requiereAprobacionInscripcion: db.requiere_aprobacion_inscripcion || false,
        activaListaEspera: db.activa_lista_espera || false
      }
    }));
  }

  private getCursosFromStorage(): Curso[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getCursos(): Promise<Curso[]> {
    if (this.useSupabase) {
      try {
        return await this.getCursosFromSupabase();
      } catch (error) {
        return this.getCursosFromStorage();
      }
    }
    return this.getCursosFromStorage();
  }

  async getCursoById(id: string): Promise<Curso | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('cursos')
          .select(`
            *,
            horarios:curso_horarios(*),
            materias:curso_materias(materia_id),
            alumnos:alumno_cursos(alumno_id)
          `)
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        return {
          id: data.id,
          carreraId: data.carrera_id,
          nombre: data.nombre,
          codigo: data.codigo,
          año: data.año,
          division: data.division,
          turno: data.turno,
          capacidad: data.capacidad,
          cupoMaximo: data.cupo_maximo,
          cupoActual: data.cupo_actual || 0,
          tutorId: data.tutor_id,
          horarios: (data.horarios || []).map((h: any) => ({
            id: h.id,
            dia: h.dia,
            horaInicio: h.hora_inicio,
            horaFin: h.hora_fin,
            materiaId: h.materia_id,
            docenteId: h.docente_id,
            aula: h.aula_id
          })),
          materias: (data.materias || []).map((m: any) => m.materia_id),
          alumnos: (data.alumnos || []).map((a: any) => a.alumno_id),
          listaEspera: [],
          estado: data.estado || 'activo',
          modalidad: data.modalidad,
          aulaId: data.aula_id,
          cuatrimestre: data.cuatrimestre,
          fechaInicio: data.fecha_inicio,
          fechaFin: data.fecha_fin,
          fechaCreacion: data.fecha_creacion,
          configuracion: {
            permiteAutoinscripcion: data.permite_autoinscripcion || false,
            permiteEdicionHorariosProfesor: data.permite_edicion_horarios_profesor || false,
            requiereAprobacionInscripcion: data.requiere_aprobacion_inscripcion || false,
            activaListaEspera: data.activa_lista_espera || false
          }
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getCursosFromStorage().find(c => c.id === id);
  }

  async getCursosByAño(año: number): Promise<Curso[]> {
    const cursos = await this.getCursos();
    return cursos.filter(c => c.año === año);
  }

  async getCursosByTurno(turno: string): Promise<Curso[]> {
    const cursos = await this.getCursos();
    return cursos.filter(c => c.turno === turno);
  }

  async getCursosByCarrera(carreraId: string): Promise<Curso[]> {
    const cursos = await this.getCursos();
    return cursos.filter(c => c.carreraId === carreraId);
  }

  async addCurso(curso: Curso): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.create('cursos', {
          id: curso.id,
          carrera_id: curso.carreraId,
          nombre: curso.nombre,
          codigo: curso.codigo,
          año: curso.año,
          division: curso.division,
          turno: curso.turno,
          capacidad: curso.capacidad,
          cupo_maximo: curso.cupoMaximo,
          cupo_actual: curso.cupoActual || 0,
          tutor_id: curso.tutorId,
          estado: curso.estado || 'activo',
          modalidad: curso.modalidad,
          aula_id: curso.aulaId,
          cuatrimestre: curso.cuatrimestre,
          fecha_inicio: curso.fechaInicio,
          fecha_fin: curso.fechaFin,
          permite_autoinscripcion: curso.configuracion?.permiteAutoinscripcion || false,
          permite_edicion_horarios_profesor: curso.configuracion?.permiteEdicionHorariosProfesor || false,
          requiere_aprobacion_inscripcion: curso.configuracion?.requiereAprobacionInscripcion || false,
          activa_lista_espera: curso.configuracion?.activaListaEspera || false,
          fecha_creacion: curso.fechaCreacion || new Date().toISOString()
        });

        // Agregar horarios
        if (curso.horarios && curso.horarios.length > 0) {
          for (const horario of curso.horarios) {
            await this.supabase.create('curso_horarios', {
              curso_id: curso.id,
              dia: horario.dia,
              hora_inicio: horario.horaInicio,
              hora_fin: horario.horaFin,
              materia_id: horario.materiaId,
              docente_id: horario.docenteId,
              aula_id: horario.aula
            });
          }
        }

        // Agregar materias
        if (curso.materias && curso.materias.length > 0) {
          for (const materiaId of curso.materias) {
            try {
              await this.supabase.create('curso_materias', {
                curso_id: curso.id,
                materia_id: materiaId
              });
            } catch (error: any) {
              // Ignorar duplicados
            }
          }
        }

        await this.loadCursos();
      } catch (error) {
        console.error('Error agregando curso:', error);
        throw error;
      }
    } else {
      const cursos = this.getCursosFromStorage();
      cursos.push(curso);
      this.saveCursosToStorage(cursos);
      this.cursosSubject.next(cursos);
    }
  }

  async updateCurso(curso: Curso): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('cursos', curso.id, {
          nombre: curso.nombre,
          codigo: curso.codigo,
          año: curso.año,
          division: curso.division,
          turno: curso.turno,
          capacidad: curso.capacidad,
          cupo_maximo: curso.cupoMaximo,
          cupo_actual: curso.cupoActual,
          tutor_id: curso.tutorId,
          estado: curso.estado,
          modalidad: curso.modalidad,
          aula_id: curso.aulaId,
          cuatrimestre: curso.cuatrimestre,
          fecha_inicio: curso.fechaInicio,
          fecha_fin: curso.fechaFin,
          permite_autoinscripcion: curso.configuracion?.permiteAutoinscripcion,
          permite_edicion_horarios_profesor: curso.configuracion?.permiteEdicionHorariosProfesor,
          requiere_aprobacion_inscripcion: curso.configuracion?.requiereAprobacionInscripcion,
          activa_lista_espera: curso.configuracion?.activaListaEspera
        });
        await this.loadCursos();
      } catch (error) {
        console.error('Error actualizando curso:', error);
        throw error;
      }
    } else {
      const cursos = this.getCursosFromStorage();
      const index = cursos.findIndex(c => c.id === curso.id);
      if (index !== -1) {
        cursos[index] = curso;
        this.saveCursosToStorage(cursos);
        this.cursosSubject.next(cursos);
      }
    }
  }

  async deleteCurso(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('cursos', id);
        await this.loadCursos();
      } catch (error) {
        console.error('Error eliminando curso:', error);
        throw error;
      }
    } else {
      const cursos = this.getCursosFromStorage().filter(c => c.id !== id);
      this.saveCursosToStorage(cursos);
      this.cursosSubject.next(cursos);
    }
  }

  async agregarAlumnoACurso(cursoId: string, alumnoId: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.create('alumno_cursos', {
          alumno_id: alumnoId,
          curso_id: cursoId,
          estado: 'inscrito',
          fecha_inscripcion: new Date().toISOString()
        });
        await this.loadCursos();
      } catch (error: any) {
        if (!error.message?.includes('duplicate')) {
          throw error;
        }
      }
    } else {
      const curso = await this.getCursoById(cursoId);
      if (curso && !curso.alumnos.includes(alumnoId)) {
        curso.alumnos.push(alumnoId);
        await this.updateCurso(curso);
      }
    }
  }

  async removerAlumnoDeCurso(cursoId: string, alumnoId: string): Promise<void> {
    if (this.useSupabase) {
      try {
        const { data } = await this.supabase.client
          .from('alumno_cursos')
          .select('id')
          .eq('alumno_id', alumnoId)
          .eq('curso_id', cursoId)
          .single();

        if (data) {
          await this.supabase.delete('alumno_cursos', data.id);
        }
        await this.loadCursos();
      } catch (error) {
        console.error('Error removiendo alumno:', error);
      }
    } else {
      const curso = await this.getCursoById(cursoId);
      if (curso) {
        curso.alumnos = curso.alumnos.filter(id => id !== alumnoId);
        await this.updateCurso(curso);
      }
    }
  }

  async agregarHorario(cursoId: string, horario: HorarioCurso): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.create('curso_horarios', {
          id: horario.id,
          curso_id: cursoId,
          dia: horario.dia,
          hora_inicio: horario.horaInicio,
          hora_fin: horario.horaFin,
          materia_id: horario.materiaId,
          docente_id: horario.docenteId,
          aula_id: horario.aula
        });
        await this.loadCursos();
      } catch (error) {
        console.error('Error agregando horario:', error);
        throw error;
      }
    } else {
      const curso = await this.getCursoById(cursoId);
      if (curso) {
        curso.horarios.push(horario);
        await this.updateCurso(curso);
      }
    }
  }

  private saveCursosToStorage(cursos: Curso[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cursos));
  }
}
