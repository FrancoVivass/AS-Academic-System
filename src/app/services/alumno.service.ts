import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Alumno, Nota, Asistencia } from '../models/alumno.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private readonly STORAGE_KEY = 'gestion_academica_alumnos';
  private readonly NOTAS_KEY = 'gestion_academica_notas';
  private readonly ASISTENCIAS_KEY = 'gestion_academica_asistencias';
  private useSupabase = true;
  private alumnosSubject = new BehaviorSubject<Alumno[]>([]);
  public alumnos$ = this.alumnosSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadAlumnos();
  }

  private async loadAlumnos(): Promise<void> {
    if (this.useSupabase) {
      try {
        const alumnos = await this.getAlumnosFromSupabase();
        this.alumnosSubject.next(alumnos);
      } catch (error) {
        console.error('Error cargando alumnos:', error);
        const alumnos = this.getAlumnosFromStorage();
        this.alumnosSubject.next(alumnos);
      }
    } else {
      const alumnos = this.getAlumnosFromStorage();
      this.alumnosSubject.next(alumnos);
    }
  }

  private async getAlumnosFromSupabase(): Promise<Alumno[]> {
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    // Filtrar alumnos por institución a través de usuarios
    const { data: alumnosData, error: alumnosError } = await this.supabase.client
      .from('alumnos')
      .select(`
        *,
        usuarios:usuarios!inner(*)
      `)
      .eq('usuarios.institucion_id', currentInstitucion.id);

    if (alumnosError) throw alumnosError;

    const alumnos: Alumno[] = [];
    for (const db of alumnosData || []) {
      const usuario = db.usuarios;
      const { data: historial } = await this.supabase.client
        .from('alumno_historial_estados')
        .select('*')
        .eq('alumno_id', db.id)
        .order('fecha', { ascending: false });

      alumnos.push({
        id: db.id,
        nombre: usuario?.nombre || '',
        apellido: usuario?.apellido || '',
        dni: db.dni,
        email: usuario?.email || '',
        telefono: usuario?.telefono || '',
        curso: '', // Se obtiene de alumno_cursos
        carreraId: db.carrera_id,
        fechaNacimiento: db.fecha_nacimiento || usuario?.fecha_nacimiento,
        direccion: usuario?.direccion || '',
        estado: db.estado || 'regular',
        activo: usuario?.activo !== false,
        fechaRegistro: usuario?.fecha_registro,
        documentacion: {
          dniCompleto: db.dni_completo || false,
          analiticoCompleto: db.analitico_completo || false,
          aptoMedicoCompleto: db.apto_medico_completo || false,
          fotocopiaDni: db.fotocopia_dni,
          analitico: db.analitico,
          aptoMedico: db.apto_medico,
          fechaValidacion: db.fecha_validacion,
          validadoPor: db.validado_por
        },
        historialEstados: (historial || []).map((h: any) => ({
          estado: h.estado,
          fecha: h.fecha,
          motivo: h.motivo,
          cambiadoPor: h.cambiado_por
        }))
      });
    }

    return alumnos;
  }

  private getAlumnosFromStorage(): Alumno[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getAlumnos(): Promise<Alumno[]> {
    if (this.useSupabase) {
      try {
        return await this.getAlumnosFromSupabase();
      } catch (error) {
        return this.getAlumnosFromStorage();
      }
    }
    return this.getAlumnosFromStorage();
  }

  async getAlumnoById(id: string): Promise<Alumno | undefined> {
    if (this.useSupabase) {
      try {
        const { data: alumnoData, error } = await this.supabase.client
          .from('alumnos')
          .select(`
            *,
            usuarios:usuarios(*)
          `)
          .eq('id', id)
          .single();

        if (error || !alumnoData) return undefined;

        const usuario = alumnoData.usuarios;
        const { data: historial } = await this.supabase.client
          .from('alumno_historial_estados')
          .select('*')
          .eq('alumno_id', id);

        return {
          id: alumnoData.id,
          nombre: usuario?.nombre || '',
          apellido: usuario?.apellido || '',
          dni: alumnoData.dni,
          email: usuario?.email || '',
          telefono: usuario?.telefono || '',
          curso: '',
          carreraId: alumnoData.carrera_id,
          fechaNacimiento: alumnoData.fecha_nacimiento || usuario?.fecha_nacimiento,
          direccion: usuario?.direccion || '',
          estado: alumnoData.estado || 'regular',
          activo: usuario?.activo !== false,
          fechaRegistro: usuario?.fecha_registro,
          documentacion: {
            dniCompleto: alumnoData.dni_completo || false,
            analiticoCompleto: alumnoData.analitico_completo || false,
            aptoMedicoCompleto: alumnoData.apto_medico_completo || false,
            fotocopiaDni: alumnoData.fotocopia_dni,
            analitico: alumnoData.analitico,
            aptoMedico: alumnoData.apto_medico,
            fechaValidacion: alumnoData.fecha_validacion,
            validadoPor: alumnoData.validado_por
          },
          historialEstados: (historial || []).map((h: any) => ({
            estado: h.estado,
            fecha: h.fecha,
            motivo: h.motivo,
            cambiadoPor: h.cambiado_por
          }))
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getAlumnosFromStorage().find(a => a.id === id);
  }

  async addAlumno(alumno: Alumno): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        // Crear usuario primero
        const usuarioData = {
          id: alumno.id,
          username: `alumno_${alumno.dni}`,
          password: 'temp123', // Debe cambiarse
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          email: alumno.email,
          telefono: alumno.telefono,
          dni: alumno.dni,
          fecha_nacimiento: alumno.fechaNacimiento,
          direccion: alumno.direccion,
          rol: 'alumno',
          institucion_id: currentInstitucion.id, // Asignar institución actual
          fecha_registro: alumno.fechaRegistro || new Date().toISOString(),
          activo: alumno.activo !== false
        };

        await this.supabase.create('usuarios', usuarioData);

        // Crear alumno
        const alumnoData = {
          id: alumno.id,
          dni: alumno.dni,
          carrera_id: alumno.carreraId,
          fecha_nacimiento: alumno.fechaNacimiento,
          estado: alumno.estado || 'regular',
          dni_completo: alumno.documentacion?.dniCompleto || false,
          analitico_completo: alumno.documentacion?.analiticoCompleto || false,
          apto_medico_completo: alumno.documentacion?.aptoMedicoCompleto || false,
          fotocopia_dni: alumno.documentacion?.fotocopiaDni,
          analitico: alumno.documentacion?.analitico,
          apto_medico: alumno.documentacion?.aptoMedico
        };

        await this.supabase.create('alumnos', alumnoData);

        // Crear historial
        if (alumno.historialEstados) {
          for (const estado of alumno.historialEstados) {
            await this.supabase.create('alumno_historial_estados', {
              alumno_id: alumno.id,
              estado: estado.estado,
              fecha: estado.fecha,
              motivo: estado.motivo,
              cambiado_por: estado.cambiadoPor
            });
          }
        }

        await this.loadAlumnos();
      } catch (error) {
        console.error('Error agregando alumno:', error);
        throw error;
      }
    } else {
      const alumnos = this.getAlumnosFromStorage();
    alumnos.push(alumno);
      this.saveAlumnosToStorage(alumnos);
      this.alumnosSubject.next(alumnos);
    }
  }

  async updateAlumno(alumno: Alumno): Promise<void> {
    if (this.useSupabase) {
      try {
        // Actualizar usuario
        await this.supabase.update('usuarios', alumno.id, {
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          email: alumno.email,
          telefono: alumno.telefono,
          direccion: alumno.direccion
        });

        // Actualizar alumno
        await this.supabase.update('alumnos', alumno.id, {
          dni: alumno.dni,
          carrera_id: alumno.carreraId,
          fecha_nacimiento: alumno.fechaNacimiento,
          estado: alumno.estado,
          dni_completo: alumno.documentacion?.dniCompleto || false,
          analitico_completo: alumno.documentacion?.analiticoCompleto || false,
          apto_medico_completo: alumno.documentacion?.aptoMedicoCompleto || false,
          fotocopia_dni: alumno.documentacion?.fotocopiaDni,
          analitico: alumno.documentacion?.analitico,
          apto_medico: alumno.documentacion?.aptoMedico
        });

        await this.loadAlumnos();
      } catch (error) {
        console.error('Error actualizando alumno:', error);
        throw error;
      }
    } else {
      const alumnos = this.getAlumnosFromStorage();
    const index = alumnos.findIndex(a => a.id === alumno.id);
    if (index !== -1) {
      alumnos[index] = alumno;
        this.saveAlumnosToStorage(alumnos);
        this.alumnosSubject.next(alumnos);
      }
    }
  }

  async deleteAlumno(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        // Las foreign keys con ON DELETE CASCADE eliminarán automáticamente
        await this.supabase.delete('usuarios', id);
        await this.loadAlumnos();
      } catch (error) {
        console.error('Error eliminando alumno:', error);
        throw error;
      }
    } else {
      const alumnos = this.getAlumnosFromStorage().filter(a => a.id !== id);
      this.saveAlumnosToStorage(alumnos);
      this.alumnosSubject.next(alumnos);
    }
  }

  private saveAlumnosToStorage(alumnos: Alumno[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alumnos));
  }

  // Notas
  async getNotas(): Promise<Nota[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('notas')
          .select('*')
          .order('fecha', { ascending: false });

        if (error) throw error;
        return (data || []).map((db: any) => ({
          id: db.id,
          alumnoId: db.alumno_id,
          materiaId: db.materia_id,
          calificacion: Number(db.calificacion),
          fecha: db.fecha,
          tipo: db.tipo,
          observaciones: db.observaciones,
          estado: db.estado || 'cargada',
          aprobadaPor: db.aprobada_por,
          fechaAprobacion: db.fecha_aprobacion,
          esRecuperatorio: db.es_recuperatorio || false,
          notaOriginalId: db.nota_original_id
        }));
      } catch (error) {
        return this.getNotasFromStorage();
      }
    }
    return this.getNotasFromStorage();
  }

  private getNotasFromStorage(): Nota[] {
    const stored = localStorage.getItem(this.NOTAS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getNotasByAlumno(alumnoId: string): Promise<Nota[]> {
    const notas = await this.getNotas();
    return notas.filter(n => n.alumnoId === alumnoId);
  }

  async getNotasByMateria(materiaId: string): Promise<Nota[]> {
    const notas = await this.getNotas();
    return notas.filter(n => n.materiaId === materiaId);
  }

  async addNota(nota: Nota): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.create('notas', {
          id: nota.id,
          alumno_id: nota.alumnoId,
          materia_id: nota.materiaId,
          curso_id: nota.cursoId,
          calificacion: nota.calificacion,
          fecha: nota.fecha,
          tipo: nota.tipo,
          observaciones: nota.observaciones,
          estado: nota.estado || 'cargada',
          aprobada_por: nota.aprobadaPor,
          fecha_aprobacion: nota.fechaAprobacion,
          es_recuperatorio: nota.esRecuperatorio || false,
          nota_original_id: nota.notaOriginalId,
          cargada_por: nota.cargadaPor || nota.alumnoId
        });
      } catch (error) {
        console.error('Error agregando nota:', error);
        throw error;
      }
    } else {
      const notas = this.getNotasFromStorage();
    notas.push(nota);
    localStorage.setItem(this.NOTAS_KEY, JSON.stringify(notas));
    }
  }

  async updateNota(nota: Nota): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('notas', nota.id, {
          calificacion: nota.calificacion,
          fecha: nota.fecha,
          tipo: nota.tipo,
          observaciones: nota.observaciones,
          estado: nota.estado,
          aprobada_por: nota.aprobadaPor,
          fecha_aprobacion: nota.fechaAprobacion
        });
      } catch (error) {
        console.error('Error actualizando nota:', error);
        throw error;
      }
    } else {
      const notas = this.getNotasFromStorage();
    const index = notas.findIndex(n => n.id === nota.id);
    if (index !== -1) {
      notas[index] = nota;
      localStorage.setItem(this.NOTAS_KEY, JSON.stringify(notas));
      }
    }
  }

  async deleteNota(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('notas', id);
      } catch (error) {
        console.error('Error eliminando nota:', error);
        throw error;
      }
    } else {
      const notas = this.getNotasFromStorage().filter(n => n.id !== id);
    localStorage.setItem(this.NOTAS_KEY, JSON.stringify(notas));
    }
  }

  async getPromedioAlumno(alumnoId: string): Promise<number> {
    const notas = await this.getNotasByAlumno(alumnoId);
    if (notas.length === 0) return 0;
    const suma = notas.reduce((acc, nota) => acc + (nota.calificacion || 0), 0);
    return Math.round((suma / notas.length) * 100) / 100;
  }

  // Asistencias
  async getAsistencias(): Promise<Asistencia[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('asistencias')
          .select('*')
          .order('fecha', { ascending: false });

        if (error) throw error;
        return (data || []).map((db: any) => ({
          id: db.id,
          alumnoId: db.alumno_id,
          materiaId: db.materia_id,
          cursoId: db.curso_id,
          horarioId: db.horario_id,
          fecha: db.fecha,
          estado: db.estado,
          presente: db.presente,
          horaRegistro: db.hora_registro,
          justificativoId: db.justificativo_id,
          tipoJustificacion: db.tipo_justificacion,
          observaciones: db.observaciones,
          cargadaPor: db.cargada_por,
          fechaCarga: db.fecha_carga,
          puedeEditar: db.puede_editar !== false,
          editadaPor: db.editada_por,
          fechaEdicion: db.fecha_edicion
        }));
      } catch (error) {
        return this.getAsistenciasFromStorage();
      }
    }
    return this.getAsistenciasFromStorage();
  }

  private getAsistenciasFromStorage(): Asistencia[] {
    const stored = localStorage.getItem(this.ASISTENCIAS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getAsistenciasByAlumno(alumnoId: string): Promise<Asistencia[]> {
    const asistencias = await this.getAsistencias();
    return asistencias.filter(a => a.alumnoId === alumnoId);
  }

  async getAsistenciasByMateria(materiaId: string): Promise<Asistencia[]> {
    const asistencias = await this.getAsistencias();
    return asistencias.filter(a => a.materiaId === materiaId);
  }

  async addAsistencia(asistencia: Asistencia): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.create('asistencias', {
          id: asistencia.id,
          alumno_id: asistencia.alumnoId,
          materia_id: asistencia.materiaId,
          curso_id: asistencia.cursoId,
          horario_id: asistencia.horarioId,
          fecha: asistencia.fecha,
          estado: asistencia.estado || (asistencia.presente ? 'presente' : 'ausente'),
          presente: asistencia.presente !== undefined ? asistencia.presente : (asistencia.estado === 'presente' || asistencia.estado === 'tardanza'),
          hora_registro: asistencia.horaRegistro,
          justificativo_id: asistencia.justificativoId,
          tipo_justificacion: asistencia.tipoJustificacion,
          observaciones: asistencia.observaciones,
          cargada_por: asistencia.cargadaPor || asistencia.alumnoId,
          puede_editar: asistencia.puedeEditar !== false,
          editada_por: asistencia.editadaPor,
          fecha_edicion: asistencia.fechaEdicion
        });
      } catch (error) {
        console.error('Error agregando asistencia:', error);
        throw error;
      }
    } else {
      const asistencias = this.getAsistenciasFromStorage();
    asistencias.push(asistencia);
    localStorage.setItem(this.ASISTENCIAS_KEY, JSON.stringify(asistencias));
    }
  }

  async updateAsistencia(asistencia: Asistencia): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('asistencias', asistencia.id, {
          estado: asistencia.estado,
          presente: asistencia.presente,
          hora_registro: asistencia.horaRegistro,
          justificativo_id: asistencia.justificativoId,
          tipo_justificacion: asistencia.tipoJustificacion,
          observaciones: asistencia.observaciones,
          editada_por: asistencia.editadaPor,
          fecha_edicion: asistencia.fechaEdicion || new Date().toISOString()
        });
      } catch (error) {
        console.error('Error actualizando asistencia:', error);
        throw error;
      }
    } else {
      const asistencias = this.getAsistenciasFromStorage();
    const index = asistencias.findIndex(a => a.id === asistencia.id);
    if (index !== -1) {
      asistencias[index] = asistencia;
      localStorage.setItem(this.ASISTENCIAS_KEY, JSON.stringify(asistencias));
      }
    }
  }

  async deleteAsistencia(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('asistencias', id);
      } catch (error) {
        console.error('Error eliminando asistencia:', error);
        throw error;
      }
    } else {
      const asistencias = this.getAsistenciasFromStorage().filter(a => a.id !== id);
    localStorage.setItem(this.ASISTENCIAS_KEY, JSON.stringify(asistencias));
    }
  }

  async getPorcentajeAsistencia(alumnoId: string, materiaId?: string): Promise<number> {
    let asistencias = await this.getAsistenciasByAlumno(alumnoId);
    if (materiaId) {
      asistencias = asistencias.filter(a => a.materiaId === materiaId);
    }
    if (asistencias.length === 0) return 0;
    const presentes = asistencias.filter(a => 
      a.estado === 'presente' || a.estado === 'tardanza' || a.estado === 'justificado'
    ).length;
    return Math.round((presentes / asistencias.length) * 100);
  }

  async getEstadisticasAsistencia(alumnoId: string, materiaId: string, cursoId?: string): Promise<{ totalClases: number; presentes: number; ausentes: number; tardanzas: number; justificados: number; porcentaje: number }> {
    let asistencias = (await this.getAsistenciasByAlumno(alumnoId)).filter(a => a.materiaId === materiaId);
    if (cursoId) {
      asistencias = asistencias.filter(a => a.cursoId === cursoId);
    }
    
    const totalClases = asistencias.length;
    const presentes = asistencias.filter(a => a.estado === 'presente').length;
    const ausentes = asistencias.filter(a => a.estado === 'ausente').length;
    const tardanzas = asistencias.filter(a => a.estado === 'tardanza').length;
    const justificados = asistencias.filter(a => a.estado === 'justificado').length;
    
    const porcentaje = totalClases > 0 
      ? Math.round(((presentes + tardanzas + justificados) / totalClases) * 100)
      : 0;
    
    return { totalClases, presentes, ausentes, tardanzas, justificados, porcentaje };
  }

  async getAsistenciasByMateriaYFecha(materiaId: string, fecha: string): Promise<Asistencia[]> {
    const asistencias = await this.getAsistencias();
    return asistencias.filter(a => a.materiaId === materiaId && a.fecha === fecha);
  }
}
