import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Alumno, Nota, Asistencia } from '../models/alumno.model';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private readonly STORAGE_KEY = 'gestion_academica_alumnos';
  private readonly NOTAS_KEY = 'gestion_academica_notas';
  private readonly ASISTENCIAS_KEY = 'gestion_academica_asistencias';
  private alumnosSubject = new BehaviorSubject<Alumno[]>(this.getAlumnos());
  public alumnos$ = this.alumnosSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const alumnos = this.getAlumnos();
    if (alumnos.length === 0) {
      const defaultAlumnos: Alumno[] = [
        {
          id: '1',
          nombre: 'Juan',
          apellido: 'Pérez',
          dni: '12345678',
          email: 'juan.perez@email.com',
          telefono: '1234567890',
          curso: '1ro A',
          fechaNacimiento: '2010-05-15',
          direccion: 'Calle Falsa 123',
          estado: 'regular',
          fechaRegistro: new Date().toISOString(),
          documentacion: {
            dniCompleto: true,
            analiticoCompleto: false,
            aptoMedicoCompleto: false
          },
          historialEstados: [{
            estado: 'regular',
            fecha: new Date().toISOString()
          }]
        },
        {
          id: '2',
          nombre: 'María',
          apellido: 'González',
          dni: '23456789',
          email: 'maria.gonzalez@email.com',
          telefono: '2345678901',
          curso: '2do B',
          fechaNacimiento: '2009-08-20',
          direccion: 'Av. Principal 456',
          estado: 'regular',
          fechaRegistro: new Date().toISOString(),
          documentacion: {
            dniCompleto: true,
            analiticoCompleto: true,
            aptoMedicoCompleto: true
          },
          historialEstados: [{
            estado: 'regular',
            fecha: new Date().toISOString()
          }]
        },
        {
          id: '3',
          nombre: 'Carlos',
          apellido: 'Rodríguez',
          dni: '34567890',
          email: 'carlos.rodriguez@email.com',
          telefono: '3456789012',
          curso: '1ro A',
          fechaNacimiento: '2010-12-10',
          direccion: 'Boulevard Central 789',
          estado: 'regular',
          fechaRegistro: new Date().toISOString(),
          documentacion: {
            dniCompleto: true,
            analiticoCompleto: false,
            aptoMedicoCompleto: false
          },
          historialEstados: [{
            estado: 'regular',
            fecha: new Date().toISOString()
          }]
        }
      ];
      this.saveAlumnos(defaultAlumnos);
    }
  }

  getAlumnos(): Alumno[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getAlumnoById(id: string): Alumno | undefined {
    return this.getAlumnos().find(a => a.id === id);
  }

  addAlumno(alumno: Alumno): void {
    const alumnos = this.getAlumnos();
    alumnos.push(alumno);
    this.saveAlumnos(alumnos);
  }

  updateAlumno(alumno: Alumno): void {
    const alumnos = this.getAlumnos();
    const index = alumnos.findIndex(a => a.id === alumno.id);
    if (index !== -1) {
      alumnos[index] = alumno;
      this.saveAlumnos(alumnos);
    }
  }

  deleteAlumno(id: string): void {
    const alumnos = this.getAlumnos().filter(a => a.id !== id);
    this.saveAlumnos(alumnos);
    
    // Eliminar notas y asistencias relacionadas
    const notas = this.getNotas().filter(n => n.alumnoId !== id);
    const asistencias = this.getAsistencias().filter(a => a.alumnoId !== id);
    localStorage.setItem(this.NOTAS_KEY, JSON.stringify(notas));
    localStorage.setItem(this.ASISTENCIAS_KEY, JSON.stringify(asistencias));
  }

  private saveAlumnos(alumnos: Alumno[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alumnos));
    this.alumnosSubject.next(alumnos);
  }

  // Notas
  getNotas(): Nota[] {
    const stored = localStorage.getItem(this.NOTAS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getNotasByAlumno(alumnoId: string): Nota[] {
    return this.getNotas().filter(n => n.alumnoId === alumnoId);
  }

  getNotasByMateria(materiaId: string): Nota[] {
    return this.getNotas().filter(n => n.materiaId === materiaId);
  }

  addNota(nota: Nota): void {
    const notas = this.getNotas();
    // Asegurar campos por defecto
    const notaCompleta: Nota = {
      ...nota,
      estado: nota.estado || 'cargada',
      esRecuperatorio: nota.esRecuperatorio || false
    };
    notas.push(notaCompleta);
    localStorage.setItem(this.NOTAS_KEY, JSON.stringify(notas));
  }

  updateNota(nota: Nota): void {
    const notas = this.getNotas();
    const index = notas.findIndex(n => n.id === nota.id);
    if (index !== -1) {
      notas[index] = nota;
      localStorage.setItem(this.NOTAS_KEY, JSON.stringify(notas));
    }
  }

  deleteNota(id: string): void {
    const notas = this.getNotas().filter(n => n.id !== id);
    localStorage.setItem(this.NOTAS_KEY, JSON.stringify(notas));
  }

  getPromedioAlumno(alumnoId: string): number {
    const notas = this.getNotasByAlumno(alumnoId);
    if (notas.length === 0) return 0;
    const suma = notas.reduce((acc, nota) => acc + (nota.calificacion || 0), 0);
    return Math.round((suma / notas.length) * 100) / 100;
  }

  // Asistencias
  getAsistencias(): Asistencia[] {
    const stored = localStorage.getItem(this.ASISTENCIAS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getAsistenciasByAlumno(alumnoId: string): Asistencia[] {
    return this.getAsistencias().filter(a => a.alumnoId === alumnoId);
  }

  getAsistenciasByMateria(materiaId: string): Asistencia[] {
    return this.getAsistencias().filter(a => a.materiaId === materiaId);
  }

  addAsistencia(asistencia: Asistencia): void {
    const asistencias = this.getAsistencias();
    // Asegurar campos por defecto y compatibilidad con modelo anterior
    const asistenciaCompleta: Asistencia = {
      ...asistencia,
      estado: asistencia.estado || (asistencia.presente ? 'presente' : 'ausente'),
      presente: asistencia.presente !== undefined ? asistencia.presente : (asistencia.estado === 'presente' || asistencia.estado === 'tardanza'),
      fechaCarga: asistencia.fechaCarga || new Date().toISOString(),
      puedeEditar: asistencia.puedeEditar !== undefined ? asistencia.puedeEditar : true
    };
    asistencias.push(asistenciaCompleta);
    localStorage.setItem(this.ASISTENCIAS_KEY, JSON.stringify(asistencias));
  }

  updateAsistencia(asistencia: Asistencia): void {
    const asistencias = this.getAsistencias();
    const index = asistencias.findIndex(a => a.id === asistencia.id);
    if (index !== -1) {
      asistencias[index] = asistencia;
      localStorage.setItem(this.ASISTENCIAS_KEY, JSON.stringify(asistencias));
    }
  }

  deleteAsistencia(id: string): void {
    const asistencias = this.getAsistencias().filter(a => a.id !== id);
    localStorage.setItem(this.ASISTENCIAS_KEY, JSON.stringify(asistencias));
  }

  getPorcentajeAsistencia(alumnoId: string, materiaId?: string): number {
    let asistencias = this.getAsistenciasByAlumno(alumnoId);
    if (materiaId) {
      asistencias = asistencias.filter(a => a.materiaId === materiaId);
    }
    if (asistencias.length === 0) return 0;
    // Contar presentes y tardanzas como asistencia, justificados no cuentan como ausentes
    const asistenciasValidas = asistencias.filter(a => 
      a.estado === 'presente' || a.estado === 'tardanza' || a.estado === 'justificado'
    );
    if (asistenciasValidas.length === 0) return 0;
    const presentes = asistencias.filter(a => 
      a.estado === 'presente' || a.estado === 'tardanza' || a.estado === 'justificado'
    ).length;
    return Math.round((presentes / asistenciasValidas.length) * 100);
  }

  getEstadisticasAsistencia(alumnoId: string, materiaId: string, cursoId?: string): { totalClases: number; presentes: number; ausentes: number; tardanzas: number; justificados: number; porcentaje: number } {
    let asistencias = this.getAsistenciasByAlumno(alumnoId).filter(a => a.materiaId === materiaId);
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

  getAsistenciasByMateriaYFecha(materiaId: string, fecha: string): Asistencia[] {
    return this.getAsistencias().filter(a => 
      a.materiaId === materiaId && a.fecha === fecha
    );
  }
}

