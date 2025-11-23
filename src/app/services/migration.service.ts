import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Institucion } from '../models/institucion.model';
import { Usuario } from '../models/usuario.model';
import { Alumno } from '../models/alumno.model';
import { Carrera } from '../models/carrera.model';
import { Materia } from '../models/materia.model';
import { Curso } from '../models/curso.model';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  private readonly MIGRATION_KEY = 'gestion_academica_migrated';

  constructor(private supabase: SupabaseService) {}

  /**
   * Verifica si la migración ya se realizó
   */
  isMigrated(): boolean {
    return localStorage.getItem(this.MIGRATION_KEY) === 'true';
  }

  /**
   * Marca la migración como completada
   */
  markAsMigrated(): void {
    localStorage.setItem(this.MIGRATION_KEY, 'true');
  }

  /**
   * Migra todos los datos de localStorage a Supabase
   */
  async migrateAll(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const results: any = {};

      // 1. Migrar Instituciones
      try {
        results.instituciones = await this.migrateInstituciones();
      } catch (error: any) {
        results.instituciones = { error: error.message };
      }

      // 2. Migrar Usuarios
      try {
        results.usuarios = await this.migrateUsuarios();
      } catch (error: any) {
        results.usuarios = { error: error.message };
      }

      // 3. Migrar Carreras
      try {
        results.carreras = await this.migrateCarreras();
      } catch (error: any) {
        results.carreras = { error: error.message };
      }

      // 4. Migrar Materias
      try {
        results.materias = await this.migrateMaterias();
      } catch (error: any) {
        results.materias = { error: error.message };
      }

      // 5. Migrar Cursos
      try {
        results.cursos = await this.migrateCursos();
      } catch (error: any) {
        results.cursos = { error: error.message };
      }

      // 6. Migrar Alumnos
      try {
        results.alumnos = await this.migrateAlumnos();
      } catch (error: any) {
        results.alumnos = { error: error.message };
      }

      // 7. Migrar Notas
      try {
        results.notas = await this.migrateNotas();
      } catch (error: any) {
        results.notas = { error: error.message };
      }

      // 8. Migrar Asistencias
      try {
        results.asistencias = await this.migrateAsistencias();
      } catch (error: any) {
        results.asistencias = { error: error.message };
      }

      // Marcar como migrado
      this.markAsMigrated();

      return {
        success: true,
        message: 'Migración completada',
        details: results
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error durante la migración',
        details: { error: error.message, stack: error.stack }
      };
    }
  }

  /**
   * Migra instituciones desde localStorage
   */
  private async migrateInstituciones(): Promise<{ migrated: number }> {
    const stored = localStorage.getItem('gestion_academica_instituciones');
    if (!stored) return { migrated: 0 };

    const instituciones: Institucion[] = JSON.parse(stored);
    let migrated = 0;

    for (const inst of instituciones) {
      try {
        // Verificar si ya existe
        const existing = await this.supabase.client
          .from('instituciones')
          .select('id')
          .eq('id', inst.id)
          .single();

        if (!existing.data) {
          // Convertir a formato de base de datos
          const dbInst = {
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
            fecha_creacion: inst.fechaCreacion || new Date().toISOString(),
            fecha_actualizacion: inst.fechaActualizacion || new Date().toISOString()
          };

          await this.supabase.create('instituciones', dbInst);
          migrated++;
        }
      } catch (error: any) {
        // Si el error es que ya existe, continuar
        if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
          throw error;
        }
      }
    }

    return { migrated };
  }

  /**
   * Migra usuarios desde localStorage
   */
  private async migrateUsuarios(): Promise<{ migrated: number }> {
    const stored = localStorage.getItem('gestion_academica_usuarios');
    if (!stored) return { migrated: 0 };

    const usuarios: Usuario[] = JSON.parse(stored);
    let migrated = 0;

    for (const user of usuarios) {
      try {
        // Verificar si ya existe
        const existing = await this.supabase.client
          .from('usuarios')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existing.data) {
          const dbUser = {
            id: user.id,
            username: user.username,
            password: user.password, // En producción, esto debería estar hasheado
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            telefono: user.telefono,
            dni: user.dni,
            fecha_nacimiento: user.fechaNacimiento,
            direccion: user.direccion,
            rol: user.rol,
            avatar: user.avatar,
            institucion_id: null, // Se asignará después
            fecha_registro: user.fechaRegistro || new Date().toISOString(),
            activo: user.activo !== false
          };

          await this.supabase.create('usuarios', dbUser);
          migrated++;

          // Si es profesor, crear registro en docentes
          if (user.rol === 'profesor') {
            const docente = {
              id: user.id,
              especialidad: (user as any).especialidad || null
            };
            try {
              await this.supabase.create('docentes', docente);
            } catch (error: any) {
              // Ignorar si ya existe
            }
          }
        }
      } catch (error: any) {
        if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
          throw error;
        }
      }
    }

    return { migrated };
  }

  /**
   * Migra carreras desde localStorage
   */
  private async migrateCarreras(): Promise<{ migrated: number }> {
    const stored = localStorage.getItem('gestion_academica_carreras');
    if (!stored) return { migrated: 0 };

    const carreras: Carrera[] = JSON.parse(stored);
    let migrated = 0;

    for (const carrera of carreras) {
      try {
        const existing = await this.supabase.client
          .from('carreras')
          .select('id')
          .eq('id', carrera.id)
          .single();

        if (!existing.data) {
          const dbCarrera = {
            id: carrera.id,
            nombre: carrera.nombre,
            codigo: carrera.codigo,
            descripcion: carrera.descripcion,
            duracion_anios: carrera.duracionAnios,
            duracion_cuatrimestres: carrera.duracionCuatrimestres,
            coordinador_id: carrera.coordinadorId || null,
            estado: carrera.estado || 'activa',
            institucion_id: null, // Se asignará después
            fecha_creacion: carrera.fechaCreacion || new Date().toISOString()
          };

          await this.supabase.create('carreras', dbCarrera);
          migrated++;
        }
      } catch (error: any) {
        if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
          throw error;
        }
      }
    }

    return { migrated };
  }

  /**
   * Migra materias desde localStorage
   */
  private async migrateMaterias(): Promise<{ migrated: number }> {
    const stored = localStorage.getItem('gestion_academica_materias');
    if (!stored) return { migrated: 0 };

    const materias: Materia[] = JSON.parse(stored);
    let migrated = 0;

    for (const materia of materias) {
      try {
        const existing = await this.supabase.client
          .from('materias')
          .select('id')
          .eq('id', materia.id)
          .single();

        if (!existing.data) {
          const dbMateria = {
            id: materia.id,
            nombre: materia.nombre,
            codigo: materia.codigo,
            descripcion: materia.descripcion,
            creditos: materia.creditos || 0,
            horas_semanales: materia.horasSemanales,
            carrera_id: materia.carreraId || null,
            tipo: materia.tipo || 'obligatoria',
            estado: materia.estado || 'activa',
            cuatrimestre: materia.cuatrimestre,
            año: materia.año,
            tiene_nota: materia.configuracion?.tieneNota !== false,
            tiene_asistencia: materia.configuracion?.tieneAsistencia !== false,
            requiere_aprobacion: materia.configuracion?.requiereAprobacion || false,
            nota_minima_aprobacion: materia.configuracion?.notaMinimaAprobacion || 6,
            porcentaje_asistencia_minimo: materia.configuracion?.porcentajeAsistenciaMinimo || 75,
            fecha_creacion: materia.fechaCreacion || new Date().toISOString()
          };

          await this.supabase.create('materias', dbMateria);
          migrated++;

          // Migrar correlatividades
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
        }
      } catch (error: any) {
        if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
          throw error;
        }
      }
    }

    return { migrated };
  }

  /**
   * Migra cursos desde localStorage
   */
  private async migrateCursos(): Promise<{ migrated: number }> {
    const stored = localStorage.getItem('gestion_academica_cursos');
    if (!stored) return { migrated: 0 };

    const cursos: Curso[] = JSON.parse(stored);
    let migrated = 0;

    for (const curso of cursos) {
      try {
        const existing = await this.supabase.client
          .from('cursos')
          .select('id')
          .eq('id', curso.id)
          .single();

        if (!existing.data) {
          const dbCurso = {
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
            tutor_id: curso.tutorId || null,
            estado: curso.estado || 'activo',
            modalidad: curso.modalidad,
            aula_id: curso.aulaId || null,
            cuatrimestre: curso.cuatrimestre,
            fecha_inicio: curso.fechaInicio,
            fecha_fin: curso.fechaFin,
            permite_autoinscripcion: curso.configuracion?.permiteAutoinscripcion || false,
            permite_edicion_horarios_profesor: curso.configuracion?.permiteEdicionHorariosProfesor || false,
            requiere_aprobacion_inscripcion: curso.configuracion?.requiereAprobacionInscripcion || false,
            activa_lista_espera: curso.configuracion?.activaListaEspera || false,
            fecha_creacion: curso.fechaCreacion || new Date().toISOString()
          };

          await this.supabase.create('cursos', dbCurso);
          migrated++;

          // Migrar horarios
          if (curso.horarios && curso.horarios.length > 0) {
            for (const horario of curso.horarios) {
              try {
                await this.supabase.create('curso_horarios', {
                  curso_id: curso.id,
                  dia: horario.dia,
                  hora_inicio: horario.horaInicio,
                  hora_fin: horario.horaFin,
                  materia_id: horario.materiaId,
                  docente_id: horario.docenteId,
                  aula_id: horario.aula || null
                });
              } catch (error: any) {
                // Ignorar errores
              }
            }
          }

          // Migrar materias del curso
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
        }
      } catch (error: any) {
        if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
          throw error;
        }
      }
    }

    return { migrated };
  }

  /**
   * Migra alumnos desde localStorage
   */
  private async migrateAlumnos(): Promise<{ migrated: number }> {
    const stored = localStorage.getItem('gestion_academica_alumnos');
    if (!stored) return { migrated: 0 };

    const alumnos: Alumno[] = JSON.parse(stored);
    let migrated = 0;

    for (const alumno of alumnos) {
      try {
        // Primero crear/actualizar el usuario
        const userExists = await this.supabase.client
          .from('usuarios')
          .select('id')
          .eq('id', alumno.id)
          .single();

        if (!userExists.data) {
          const dbUser = {
            id: alumno.id,
            username: `alumno_${alumno.dni}`,
            password: 'temp123', // Debe cambiarse en producción
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            email: alumno.email,
            telefono: alumno.telefono,
            dni: alumno.dni,
            fecha_nacimiento: alumno.fechaNacimiento,
            direccion: alumno.direccion,
            rol: 'alumno',
            institucion_id: null,
            fecha_registro: alumno.fechaRegistro || new Date().toISOString(),
            activo: alumno.activo !== false
          };

          await this.supabase.create('usuarios', dbUser);
        }

        // Luego crear el registro de alumno
        const alumnoExists = await this.supabase.client
          .from('alumnos')
          .select('id')
          .eq('id', alumno.id)
          .single();

        if (!alumnoExists.data) {
          const dbAlumno = {
            id: alumno.id,
            dni: alumno.dni,
            carrera_id: alumno.carreraId || null,
            fecha_nacimiento: alumno.fechaNacimiento,
            estado: alumno.estado || 'regular',
            dni_completo: alumno.documentacion?.dniCompleto || false,
            analitico_completo: alumno.documentacion?.analiticoCompleto || false,
            apto_medico_completo: alumno.documentacion?.aptoMedicoCompleto || false,
            fotocopia_dni: alumno.documentacion?.fotocopiaDni,
            analitico: alumno.documentacion?.analitico,
            apto_medico: alumno.documentacion?.aptoMedico,
            fecha_validacion: alumno.documentacion?.fechaValidacion,
            validado_por: alumno.documentacion?.validadoPor
          };

          await this.supabase.create('alumnos', dbAlumno);
          migrated++;

          // Migrar historial de estados
          if (alumno.historialEstados && alumno.historialEstados.length > 0) {
            for (const estado of alumno.historialEstados) {
              try {
                await this.supabase.create('alumno_historial_estados', {
                  alumno_id: alumno.id,
                  estado: estado.estado,
                  fecha: estado.fecha,
                  motivo: estado.motivo,
                  cambiado_por: estado.cambiadoPor
                });
              } catch (error: any) {
                // Ignorar errores
              }
            }
          }
        }
      } catch (error: any) {
        if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
          throw error;
        }
      }
    }

    return { migrated };
  }

  /**
   * Migra notas desde localStorage
   */
  private async migrateNotas(): Promise<{ migrated: number }> {
    const stored = localStorage.getItem('gestion_academica_notas');
    if (!stored) return { migrated: 0 };

    const notas: any[] = JSON.parse(stored);
    let migrated = 0;

    for (const nota of notas) {
      try {
        const existing = await this.supabase.client
          .from('notas')
          .select('id')
          .eq('id', nota.id)
          .single();

        if (!existing.data) {
          const dbNota = {
            id: nota.id,
            alumno_id: nota.alumnoId,
            materia_id: nota.materiaId,
            curso_id: nota.cursoId || null,
            calificacion: nota.calificacion,
            fecha: nota.fecha,
            tipo: nota.tipo,
            observaciones: nota.observaciones,
            estado: nota.estado || 'cargada',
            aprobada_por: nota.aprobadaPor,
            fecha_aprobacion: nota.fechaAprobacion,
            es_recuperatorio: nota.esRecuperatorio || false,
            nota_original_id: nota.notaOriginalId,
            cargada_por: nota.cargadaPor || nota.alumnoId // Fallback
          };

          await this.supabase.create('notas', dbNota);
          migrated++;
        }
      } catch (error: any) {
        if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
          throw error;
        }
      }
    }

    return { migrated };
  }

  /**
   * Migra asistencias desde localStorage
   */
  private async migrateAsistencias(): Promise<{ migrated: number }> {
    const stored = localStorage.getItem('gestion_academica_asistencias');
    if (!stored) return { migrated: 0 };

    const asistencias: any[] = JSON.parse(stored);
    let migrated = 0;

    for (const asistencia of asistencias) {
      try {
        const dbAsistencia = {
          id: asistencia.id,
          alumno_id: asistencia.alumnoId,
          materia_id: asistencia.materiaId,
          curso_id: asistencia.cursoId || null,
          horario_id: asistencia.horarioId || null,
          fecha: asistencia.fecha,
          estado: asistencia.estado || (asistencia.presente ? 'presente' : 'ausente'),
          presente: asistencia.presente !== false,
          hora_registro: asistencia.horaRegistro,
          justificativo_id: asistencia.justificativoId,
          tipo_justificacion: asistencia.tipoJustificacion,
          observaciones: asistencia.observaciones,
          cargada_por: asistencia.cargadaPor || asistencia.alumnoId,
          puede_editar: asistencia.puedeEditar !== false,
          editada_por: asistencia.editadaPor,
          fecha_edicion: asistencia.fechaEdicion
        };

        await this.supabase.create('asistencias', dbAsistencia);
        migrated++;
      } catch (error: any) {
        // Ignorar duplicados
        if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
          // Continuar con el siguiente
        }
      }
    }

    return { migrated };
  }
}

