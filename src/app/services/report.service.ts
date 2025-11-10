import { Injectable } from '@angular/core';
import { AlumnoService } from './alumno.service';
import { MateriaService } from './materia.service';
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
    private materiaService: MateriaService
  ) {}

  generarReporteAlumnos(): ReporteAlumno[] {
    const alumnos = this.alumnoService.getAlumnos();
    return alumnos.map(alumno => {
      const promedio = this.alumnoService.getPromedioAlumno(alumno.id);
      const porcentajeAsistencia = this.alumnoService.getPorcentajeAsistencia(alumno.id);
      const notas = this.alumnoService.getNotasByAlumno(alumno.id);
      const asistencias = this.alumnoService.getAsistenciasByAlumno(alumno.id);
      const inscripciones = this.materiaService.getInscripcionesByAlumno(alumno.id);

      return {
        alumno,
        promedio,
        porcentajeAsistencia,
        cantidadNotas: notas.length,
        cantidadAsistencias: asistencias.length,
        materiasInscritas: inscripciones.length
      };
    });
  }

  generarReporteMaterias(): ReporteMateria[] {
    const materias = this.materiaService.getMaterias();
    return materias.map(materia => {
      const inscripciones = this.materiaService.getInscripcionesByMateria(materia.id);
      const notas = this.alumnoService.getNotasByMateria(materia.id);
      const asistencias = this.alumnoService.getAsistenciasByMateria(materia.id);

      const promediosAlumnos = inscripciones.map(insc => {
        const notasAlumno = notas.filter(n => n.alumnoId === insc.alumnoId);
        const promedio = notasAlumno.length > 0
          ? notasAlumno.reduce((sum, n) => sum + n.calificacion, 0) / notasAlumno.length
          : 0;
        const alumno = this.alumnoService.getAlumnoById(insc.alumnoId);
        return {
          nombre: alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Desconocido',
          promedio: Math.round(promedio * 100) / 100
        };
      }).sort((a, b) => b.promedio - a.promedio).slice(0, 5);

      const promedioGeneral = notas.length > 0
        ? notas.reduce((sum, n) => sum + n.calificacion, 0) / notas.length
        : 0;

      const presentes = asistencias.filter(a => a.presente).length;
      const porcentajeAsistencia = asistencias.length > 0
        ? (presentes / asistencias.length) * 100
        : 0;

      return {
        materia,
        cantidadInscritos: inscripciones.length,
        promedioGeneral: Math.round(promedioGeneral * 100) / 100,
        porcentajeAsistencia: Math.round(porcentajeAsistencia * 100) / 100,
        mejoresAlumnos: promediosAlumnos
      };
    });
  }

  exportarReporteCompleto(): string {
    const reporteAlumnos = this.generarReporteAlumnos();
    const reporteMaterias = this.generarReporteMaterias();

    let csv = 'REPORTE COMPLETO - SISTEMA DE GESTIÓN ACADÉMICA\n';
    csv += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;

    csv += '=== REPORTE DE ALUMNOS ===\n';
    csv += 'Nombre,Apellido,DNI,Curso,Promedio,Asistencia%,Notas,Asistencias,Materias\n';
    reporteAlumnos.forEach(r => {
      csv += `${r.alumno.nombre},${r.alumno.apellido},${r.alumno.dni},${r.alumno.curso},${r.promedio},${r.porcentajeAsistencia},${r.cantidadNotas},${r.cantidadAsistencias},${r.materiasInscritas}\n`;
    });

    csv += '\n=== REPORTE DE MATERIAS ===\n';
    csv += 'Nombre,Código,Profesor,Inscritos,Promedio General,Asistencia%\n';
    reporteMaterias.forEach(r => {
      csv += `${r.materia.nombre},${r.materia.codigo},${r.materia.profesor},${r.cantidadInscritos},${r.promedioGeneral},${r.porcentajeAsistencia}\n`;
    });

    return csv;
  }
}

