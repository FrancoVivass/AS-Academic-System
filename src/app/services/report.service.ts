import { Injectable } from '@angular/core';
import { AlumnoService } from './alumno.service';
import { MateriaService } from './materia.service';
import { CursoService } from './curso.service';
import { Alumno, Nota, Asistencia } from '../models/alumno.model';
import { Materia } from '../models/materia.model';

export interface ReporteAlumno {
  alumno: Alumno;
  promedio: number;
  porcentajeAsistencia: number;
  cantidadNotas: number;
  cantidadAsistencias: number;
  materiasInscritas: number;
}

export interface ReporteMateria {
  materia: Materia;
  cantidadInscritos: number;
  promedioGeneral: number;
  porcentajeAsistencia: number;
  mejoresAlumnos: { nombre: string; promedio: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private cursoService: CursoService
  ) {}

  async generarReporteAlumnos(): Promise<ReporteAlumno[]> {
    const alumnos = await this.alumnoService.getAlumnos();
    const reportes = await Promise.all(alumnos.map(async alumno => {
      const promedio = await this.alumnoService.getPromedioAlumno(alumno.id);
      const porcentajeAsistencia = await this.alumnoService.getPorcentajeAsistencia(alumno.id);
      const notas = await this.alumnoService.getNotasByAlumno(alumno.id);
      const asistencias = await this.alumnoService.getAsistenciasByAlumno(alumno.id);
      const inscripciones = this.materiaService.getInscripcionesByAlumno(alumno.id);

      return {
        alumno,
        promedio,
        porcentajeAsistencia,
        cantidadNotas: notas.length,
        cantidadAsistencias: asistencias.length,
        materiasInscritas: inscripciones.length
      };
    }));
    return reportes;
  }

  async generarReporteMaterias(): Promise<ReporteMateria[]> {
    const materias = await this.materiaService.getMaterias();
    const todosLosCursos = await this.cursoService.getCursos();
    
    const reportes = await Promise.all(materias.map(async materia => {
      // Obtener todos los cursos que tienen esta materia
      const cursosConMateria = todosLosCursos.filter(curso => 
        curso.materias && curso.materias.includes(materia.id)
      );
      
      // Obtener todos los alumnos únicos de esos cursos
      const idsAlumnos = new Set<string>();
      cursosConMateria.forEach(curso => {
        if (curso.alumnos && Array.isArray(curso.alumnos)) {
          curso.alumnos.forEach((alumnoId: string) => idsAlumnos.add(alumnoId));
        }
      });
      
      // También considerar alumnos que tienen cursoId o cursoIds que coinciden con los cursos
      const todosLosAlumnos = await this.alumnoService.getAlumnos();
      todosLosAlumnos.forEach(alumno => {
        // Si el alumno tiene cursoId que coincide con alguno de los cursos
        if (alumno.cursoId && cursosConMateria.some(c => c.id === alumno.cursoId)) {
          idsAlumnos.add(alumno.id);
        }
        // Si el alumno tiene cursoIds que incluyen alguno de los cursos
        if (alumno.cursoIds && Array.isArray(alumno.cursoIds)) {
          alumno.cursoIds.forEach(cursoId => {
            if (cursosConMateria.some(c => c.id === cursoId)) {
              idsAlumnos.add(alumno.id);
            }
          });
        }
      });
      
      const cantidadInscritos = idsAlumnos.size;
      const alumnosIdsArray = Array.from(idsAlumnos);
      
      const notas = await this.alumnoService.getNotasByMateria(materia.id);
      const asistencias = await this.alumnoService.getAsistenciasByMateria(materia.id);

      // Calcular mejores alumnos basado en los alumnos de los cursos
      const promediosAlumnosPromises = alumnosIdsArray.map(async alumnoId => {
        const notasAlumno = notas.filter(n => n.alumnoId === alumnoId);
        const promedio = notasAlumno.length > 0
          ? notasAlumno.reduce((sum: number, n) => sum + n.calificacion, 0) / notasAlumno.length
          : 0;
        const alumno = await this.alumnoService.getAlumnoById(alumnoId);
        return {
          nombre: alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Desconocido',
          promedio: Math.round(promedio * 100) / 100
        };
      });
      const promediosAlumnos = (await Promise.all(promediosAlumnosPromises))
        .filter(a => a.promedio > 0)
        .sort((a, b) => b.promedio - a.promedio)
        .slice(0, 5);

      const promedioGeneral = notas.length > 0
        ? notas.reduce((sum: number, n) => sum + n.calificacion, 0) / notas.length
        : 0;

      const presentes = asistencias.filter(a => a.estado === 'presente' || a.estado === 'tardanza' || a.estado === 'justificado').length;
      const porcentajeAsistencia = asistencias.length > 0
        ? (presentes / asistencias.length) * 100
        : 0;

      return {
        materia,
        cantidadInscritos: cantidadInscritos,
        promedioGeneral: Math.round(promedioGeneral * 100) / 100,
        porcentajeAsistencia: Math.round(porcentajeAsistencia * 100) / 100,
        mejoresAlumnos: promediosAlumnos
      };
    }));
    return reportes;
  }

  async exportarReporteCompleto(): Promise<string> {
    const reporteAlumnos = await this.generarReporteAlumnos();
    const reporteMaterias = await this.generarReporteMaterias();

    let csv = 'REPORTE COMPLETO - SISTEMA DE GESTIÓN ACADÉMICA\n';
    csv += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;

    csv += '=== REPORTE DE ALUMNOS ===\n';
    csv += 'Nombre,Apellido,DNI,Curso,Promedio,Asistencia%,Notas,Asistencias,Materias\n';
    reporteAlumnos.forEach(r => {
      // Escapar valores que contengan comas, comillas o saltos de línea
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      csv += `${escapeCSV(r.alumno.nombre)},${escapeCSV(r.alumno.apellido)},${escapeCSV(r.alumno.dni)},${escapeCSV(r.alumno.curso)},${escapeCSV(r.promedio)},${escapeCSV(r.porcentajeAsistencia)},${escapeCSV(r.cantidadNotas)},${escapeCSV(r.cantidadAsistencias)},${escapeCSV(r.materiasInscritas)}\n`;
    });

    csv += '\n=== REPORTE DE MATERIAS ===\n';
    csv += 'Nombre,Código,Profesor,Inscritos,Promedio General,Asistencia%\n';
    reporteMaterias.forEach(r => {
      // Escapar valores que contengan comas, comillas o saltos de línea
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      csv += `${escapeCSV(r.materia.nombre)},${escapeCSV(r.materia.codigo)},${escapeCSV(r.materia.profesor)},${escapeCSV(r.cantidadInscritos)},${escapeCSV(r.promedioGeneral)},${escapeCSV(r.porcentajeAsistencia)}\n`;
    });

    return csv;
  }
}

