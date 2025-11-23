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
    const reportes = await Promise.all(materias.map(async materia => {
      const inscripciones = this.materiaService.getInscripcionesByMateria(materia.id);
      const notas = await this.alumnoService.getNotasByMateria(materia.id);
      const asistencias = await this.alumnoService.getAsistenciasByMateria(materia.id);

      const promediosAlumnosPromises = inscripciones.map(async insc => {
        const notasAlumno = notas.filter(n => n.alumnoId === insc.alumnoId);
        const promedio = notasAlumno.length > 0
          ? notasAlumno.reduce((sum: number, n) => sum + n.calificacion, 0) / notasAlumno.length
          : 0;
        const alumno = await this.alumnoService.getAlumnoById(insc.alumnoId);
        return {
          nombre: alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Desconocido',
          promedio: Math.round(promedio * 100) / 100
        };
      });
      const promediosAlumnos = (await Promise.all(promediosAlumnosPromises)).sort((a, b) => b.promedio - a.promedio).slice(0, 5);

      const promedioGeneral = notas.length > 0
        ? notas.reduce((sum: number, n) => sum + n.calificacion, 0) / notas.length
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

