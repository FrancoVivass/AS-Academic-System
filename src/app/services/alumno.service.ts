import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Alumno, Nota, Asistencia } from '../models/alumno.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private alumnosSubject = new BehaviorSubject<Alumno[]>([]);
  public alumnos$ = this.alumnosSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadAlumnos();
  }

  private async loadAlumnos(): Promise<void> {
    try {
      const alumnos = await this.getAlumnosFromSupabase();
      this.alumnosSubject.next(alumnos);
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      console.error('Detalle del error:', JSON.stringify(error, null, 2));
      this.alumnosSubject.next([]);
    }
  }

  // Método público para forzar recarga de alumnos desde la base de datos
  async recargarAlumnos(): Promise<void> {
    await this.loadAlumnos();
  }

  private async getAlumnosFromSupabase(): Promise<Alumno[]> {
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      console.warn('No hay institución seleccionada');
      return [];
    }

    // Filtrar alumnos por institución a través de usuarios
    // Primero obtener los IDs de usuarios de la institución
    const { data: usuariosData, error: usuariosError } = await this.supabase.client
      .from('usuarios')
      .select('id')
      .eq('institucion_id', currentInstitucion.id)
      .eq('rol', 'alumno');

    if (usuariosError) {
      console.error('Error obteniendo usuarios de la institución:', usuariosError);
      throw usuariosError;
    }

    if (!usuariosData || usuariosData.length === 0) {
      console.log('No se encontraron usuarios de la institución:', currentInstitucion.nombre);
      return [];
    }

    const usuarioIds = usuariosData.map((u: any) => u.id);
    console.log(`Encontrados ${usuarioIds.length} usuarios de la institución ${currentInstitucion.nombre}`);

    // Ahora obtener los alumnos de esos usuarios
    // Nota: La relación entre alumnos y usuarios es que alumnos.id = usuarios.id
    // Usar una consulta más simple sin join para evitar errores
    const { data: alumnosData, error: alumnosError } = await this.supabase.client
      .from('alumnos')
      .select('*')
      .in('id', usuarioIds);

    if (alumnosError) {
      console.error('Error obteniendo alumnos:', alumnosError);
      console.error('Detalle del error:', JSON.stringify(alumnosError, null, 2));
      throw alumnosError;
    }

    if (!alumnosData || alumnosData.length === 0) {
      console.log('No se encontraron alumnos para la institución:', currentInstitucion.nombre);
      return [];
    }

    const alumnos: Alumno[] = [];
    for (const db of alumnosData) {
      // Obtener el usuario correspondiente por separado
      const { data: usuarioData, error: usuarioError } = await this.supabase.client
        .from('usuarios')
        .select('*')
        .eq('id', db.id)
        .single();
      
      if (usuarioError || !usuarioData) {
        console.warn('Alumno sin usuario asociado:', db.id, usuarioError);
        continue;
      }
      
      const usuario = usuarioData;

      // Obtener historial de estados
      const { data: historial } = await this.supabase.client
        .from('alumno_historial_estados')
        .select('*')
        .eq('alumno_id', db.id)
        .order('fecha', { ascending: false });

      // Obtener todos los cursos del alumno desde alumno_cursos
      let cursoNombre = '';
      let cursoIdPrincipal: string | undefined;
      const cursoIds: string[] = [];
      
      try {
        const { data: alumnoCursosData } = await this.supabase.client
          .from('alumno_cursos')
          .select('curso_id')
          .eq('alumno_id', db.id)
          .eq('estado', 'inscrito');

        if (alumnoCursosData && alumnoCursosData.length > 0) {
          // Guardar todos los cursoIds
          alumnoCursosData.forEach((ac: any) => {
            if (ac.curso_id) {
              cursoIds.push(ac.curso_id);
            }
          });
          
          // El primer curso es el principal
          const cursoId = alumnoCursosData[0].curso_id;
          cursoIdPrincipal = cursoId;
          
          // Obtener datos del curso principal - usar select con todas las columnas necesarias
          const { data: cursoData, error: cursoError } = await this.supabase.client
            .from('cursos')
            .select('*')
            .eq('id', cursoId)
            .single();

          if (cursoData && !cursoError) {
            // Acceder a la columna año usando notación de corchetes para evitar problemas con TypeScript
            const año = (cursoData as any)['año'] || (cursoData as any).ano;
            const division = cursoData.division;
            if (año && division) {
              cursoNombre = `${año}° ${division}`;
            }
          }
        }
      } catch (error) {
        // Si hay error obteniendo el curso, simplemente no mostrar curso
        console.warn(`Error obteniendo curso para alumno ${db.id}:`, error);
      }

      alumnos.push({
        id: db.id,
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        dni: db.dni,
        email: usuario.email || '',
        telefono: usuario.telefono || '',
        curso: cursoNombre,
        cursoId: cursoIdPrincipal,
        cursoIds: cursoIds.length > 0 ? cursoIds : undefined,
        carreraId: db.carrera_id || '',
        fechaNacimiento: db.fecha_nacimiento || usuario.fecha_nacimiento,
        direccion: usuario.direccion || '',
        estado: db.estado || 'regular',
        activo: usuario.activo !== false,
        fechaRegistro: usuario.fecha_registro,
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

    console.log(`Cargados ${alumnos.length} alumnos para la institución ${currentInstitucion.nombre}`);
    return alumnos;
  }

  async getAlumnos(): Promise<Alumno[]> {
    try {
      // Primero intentar obtener del observable (más rápido si ya está cargado)
      const alumnosActuales = this.alumnosSubject.value;
      if (alumnosActuales && alumnosActuales.length > 0) {
        return alumnosActuales;
      }
      // Si no hay en el observable, cargar desde la base de datos
      return await this.getAlumnosFromSupabase();
    } catch (error) {
      console.error('Error obteniendo alumnos:', error);
      console.error('Detalle del error:', JSON.stringify(error, null, 2));
      return [];
    }
  }

  async getAlumnoById(id: string): Promise<Alumno | undefined> {
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
      console.error('Error obteniendo alumno por ID:', error);
      return undefined;
    }
  }

  async addAlumno(alumno: Alumno): Promise<void> {
    try {
      // Obtener la institución actual
      const currentInstitucion = this.institucionService.getCurrentInstitucion();
      if (!currentInstitucion) {
        throw new Error('Debe seleccionar una institución primero');
      }

      // Verificar si el usuario ya existe
      const { data: usuarioExistente } = await this.supabase.client
        .from('usuarios')
        .select('id')
        .eq('id', alumno.id)
        .single();

      // Crear usuario solo si no existe
      if (!usuarioExistente) {
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
      }

      // Crear alumno
      const alumnoData = {
        id: alumno.id,
        dni: alumno.dni,
        carrera_id: alumno.carreraId || null,
        fecha_nacimiento: alumno.fechaNacimiento || null,
        estado: alumno.estado || 'regular',
        dni_completo: alumno.documentacion?.dniCompleto || false,
        analitico_completo: alumno.documentacion?.analiticoCompleto || false,
        apto_medico_completo: alumno.documentacion?.aptoMedicoCompleto || false,
        fotocopia_dni: alumno.documentacion?.fotocopiaDni || null,
        analitico: alumno.documentacion?.analitico || null,
        apto_medico: alumno.documentacion?.aptoMedico || null
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

      // Recargar alumnos después de agregar
      await this.loadAlumnos();
    } catch (error) {
      console.error('Error agregando alumno:', error);
      throw error;
    }
  }

  async updateAlumno(alumno: Alumno): Promise<void> {
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

      // Recargar alumnos después de actualizar
      await this.loadAlumnos();
    } catch (error) {
      console.error('Error actualizando alumno:', error);
      throw error;
    }
  }

  async deleteAlumno(id: string): Promise<void> {
    try {
      // Las foreign keys con ON DELETE CASCADE eliminarán automáticamente
      await this.supabase.delete('usuarios', id);
      // Recargar alumnos después de eliminar
      await this.loadAlumnos();
    } catch (error) {
      console.error('Error eliminando alumno:', error);
      throw error;
    }
  }

  // Notas
  async getNotas(): Promise<Nota[]> {
    try {
      // Obtener la institución actual para filtrar
      const currentInstitucion = this.institucionService.getCurrentInstitucion();
      if (!currentInstitucion) {
        console.warn('No hay institución seleccionada');
        return [];
      }

      // Obtener IDs de alumnos de la institución actual
      const { data: usuariosData } = await this.supabase.client
        .from('usuarios')
        .select('id')
        .eq('institucion_id', currentInstitucion.id)
        .eq('rol', 'alumno');

      if (!usuariosData || usuariosData.length === 0) {
        return [];
      }

      const alumnoIds = usuariosData.map(u => u.id);

      // Obtener notas de alumnos de la institución actual
      const { data, error } = await this.supabase.client
        .from('notas')
        .select('*')
        .in('alumno_id', alumnoIds)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return (data || []).map((db: any) => ({
        id: db.id,
        alumnoId: db.alumno_id,
        materiaId: db.materia_id,
        cursoId: db.curso_id,
        calificacion: Number(db.calificacion),
        fecha: db.fecha,
        tipo: db.tipo,
        observaciones: db.observaciones,
        estado: db.estado || 'cargada',
        aprobadaPor: db.aprobada_por,
        fechaAprobacion: db.fecha_aprobacion,
        esRecuperatorio: db.es_recuperatorio || false,
        notaOriginalId: db.nota_original_id,
        cargadaPor: db.cargada_por
      }));
    } catch (error) {
      console.error('Error obteniendo notas:', error);
      return [];
    }
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
  }

  async updateNota(nota: Nota): Promise<void> {
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
  }

  async deleteNota(id: string): Promise<void> {
    try {
      await this.supabase.delete('notas', id);
    } catch (error) {
      console.error('Error eliminando nota:', error);
      throw error;
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
      console.error('Error obteniendo asistencias:', error);
      return [];
    }
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
  }

  async updateAsistencia(asistencia: Asistencia): Promise<void> {
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
  }

  async deleteAsistencia(id: string): Promise<void> {
    try {
      await this.supabase.delete('asistencias', id);
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
      throw error;
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
