import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MateriaService } from '../../services/materia.service';
import { AlumnoService } from '../../services/alumno.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { Materia, AlumnoMateria } from '../../models/materia.model';
import { Alumno } from '../../models/alumno.model';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css'
})
export class MateriasComponent implements OnInit {
  materias: Materia[] = [];
  materiasFiltradas: Materia[] = [];
  materiaSeleccionada: Materia | null = null;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  busqueda: string = '';
  filtroCurso: string = '';

  formData: Partial<Materia> = {
    nombre: '',
    codigo: '',
    descripcion: '',
    profesor: '',
    curso: '',
    horario: '',
    creditos: 0
  };

  mostrarInscripciones: boolean = false;
  alumnosDisponibles: Alumno[] = [];
  alumnosInscritos: Alumno[] = [];

  constructor(
    private materiaService: MateriaService,
    private alumnoService: AlumnoService,
    private authService: AuthService,
    public permissionsService: PermissionsService
  ) {}

  ngOnInit(): void {
    this.loadMaterias();
  }

  loadMaterias(): void {
    let todasLasMaterias = this.materiaService.getMaterias();
    
    // Si es alumno, solo mostrar materias en las que está inscrito
    if (this.permissionsService.esAlumno()) {
      const usuarioId = this.authService.getCurrentUser()?.id;
      if (usuarioId) {
        const inscripciones = this.materiaService.getInscripcionesByAlumno(usuarioId);
        todasLasMaterias = todasLasMaterias.filter(m => 
          inscripciones.some(i => i.materiaId === m.id)
        );
      }
    }
    // Si es profesor, solo mostrar sus materias asignadas
    else if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      const materiasAsignadas = (usuario as any).materiasAsignadas || [];
      todasLasMaterias = todasLasMaterias.filter(m => materiasAsignadas.includes(m.id));
    }
    
    this.materias = todasLasMaterias;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtradas = [...this.materias];

    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      filtradas = filtradas.filter(m =>
        m.nombre.toLowerCase().includes(busquedaLower) ||
        m.codigo.toLowerCase().includes(busquedaLower) ||
        m.profesor.toLowerCase().includes(busquedaLower)
      );
    }

    if (this.filtroCurso) {
      filtradas = filtradas.filter(m => m.curso === this.filtroCurso);
    }

    this.materiasFiltradas = filtradas;
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onFiltroCursoChange(): void {
    this.aplicarFiltros();
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.materiaSeleccionada = null;
    this.mostrarModal = true;
    this.formData = {
      nombre: '',
      codigo: '',
      descripcion: '',
      profesor: '',
      curso: '',
      horario: '',
      creditos: 0
    };
  }

  abrirModalEditar(materia: Materia): void {
    this.modoEdicion = true;
    this.materiaSeleccionada = materia;
    this.mostrarModal = true;
    this.formData = { ...materia };
  }

  guardarMateria(): void {
    if (!this.validarFormulario()) return;

    if (this.modoEdicion && this.materiaSeleccionada) {
      const materiaActualizada: Materia = {
        ...this.materiaSeleccionada,
        ...this.formData
      } as Materia;
      this.materiaService.updateMateria(materiaActualizada);
    } else {
      const nuevaMateria: Materia = {
        id: Date.now().toString(),
        ...this.formData
      } as Materia;
      this.materiaService.addMateria(nuevaMateria);
    }

    this.loadMaterias();
    this.cerrarModal();
  }

  eliminarMateria(id: string): void {
    if (confirm('¿Está seguro de eliminar esta materia?')) {
      this.materiaService.deleteMateria(id);
      this.loadMaterias();
    }
  }

  abrirInscripciones(materia: Materia): void {
    this.materiaSeleccionada = materia;
    this.mostrarInscripciones = true;
    this.cargarAlumnosInscripcion();
  }

  cargarAlumnosInscripcion(): void {
    if (!this.materiaSeleccionada) return;
    
    this.alumnosDisponibles = this.alumnoService.getAlumnos();
    const inscripciones = this.materiaService.getInscripcionesByMateria(this.materiaSeleccionada.id);
    const idsInscritos = inscripciones.map(i => i.alumnoId);
    
    this.alumnosInscritos = this.alumnosDisponibles.filter(a => idsInscritos.includes(a.id));
    this.alumnosDisponibles = this.alumnosDisponibles.filter(a => !idsInscritos.includes(a.id));
  }

  inscribirAlumno(alumnoId: string): void {
    if (!this.materiaSeleccionada) return;
    
    const inscripcion: AlumnoMateria = {
      id: Date.now().toString(),
      alumnoId,
      materiaId: this.materiaSeleccionada.id,
      fechaInscripcion: new Date().toISOString()
    };
    
    this.materiaService.inscribirAlumno(inscripcion);
    this.cargarAlumnosInscripcion();
  }

  desinscribirAlumno(alumnoId: string): void {
    if (!this.materiaSeleccionada) return;
    
    this.materiaService.desinscribirAlumno(alumnoId, this.materiaSeleccionada.id);
    this.cargarAlumnosInscripcion();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.materiaSeleccionada = null;
    this.modoEdicion = false;
    this.mostrarInscripciones = false;
  }

  validarFormulario(): boolean {
    return !!(
      this.formData.nombre &&
      this.formData.codigo &&
      this.formData.profesor &&
      this.formData.curso
    );
  }

  getCursosUnicos(): string[] {
    const cursos = this.materias.map(m => m.curso).filter((c, i, arr) => arr.indexOf(c) === i);
    return cursos.sort();
  }

  getCantidadInscritos(materiaId: string): number {
    return this.materiaService.getInscripcionesByMateria(materiaId).length;
  }
}

