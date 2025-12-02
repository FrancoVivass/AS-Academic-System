import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../services/auth.service';
import { AlumnoService } from '../../services/alumno.service';
import { DocenteService } from '../../services/docente.service';
import { MateriaService } from '../../services/materia.service';
import { CarreraService } from '../../services/carrera.service';
import { CursoService } from '../../services/curso.service';
import { NotificationService } from '../../services/notification.service';
import { Usuario, Docente } from '../../models/usuario.model';
import { Alumno } from '../../models/alumno.model';
import { Materia } from '../../models/materia.model';
import { Carrera } from '../../models/carrera.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  usuarioPerfil: Usuario | null = null;
  usuarioActual: Usuario | null = null;
  alumnoData: Alumno | null = null;
  docenteData: Docente | null = null;
  materias: Materia[] = [];
  carrera: Carrera | null = null;
  cursos: any[] = [];
  
  esMiPerfil: boolean = false;
  modoEdicion: boolean = false;
  
  formData: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    direccion?: string;
    fechaNacimiento?: string;
    avatar?: string;
    especialidad?: string; // Para profesores
  } = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    avatar: '',
    especialidad: ''
  };

  estadisticas: {
    promedio?: number;
    asistencia?: number;
    materiasInscritas?: number;
    tareasCompletadas?: number;
    materiasAsignadas?: number; // Para profesores
    alumnosTotales?: number; // Para profesores
  } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private alumnoService: AlumnoService,
    private docenteService: DocenteService,
    private materiaService: MateriaService,
    private carreraService: CarreraService,
    private cursoService: CursoService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.usuarioActual = this.authService.getCurrentUser();
    
    // Obtener ID del usuario desde la ruta
    this.route.params.subscribe(async params => {
      const usuarioId = params['id'];
      
      if (usuarioId) {
        // Ver perfil de otro usuario
        await this.cargarPerfilUsuario(usuarioId);
      } else {
        // Ver mi propio perfil
        if (this.usuarioActual) {
          await this.cargarPerfilUsuario(this.usuarioActual.id);
          this.esMiPerfil = true;
        }
      }
    });
  }

  async cargarPerfilUsuario(usuarioId: string): Promise<void> {
    try {
      // Cargar usuario
      const usuario = await this.authService.getUsuarioById(usuarioId);
      if (!usuario) {
        this.notificationService.showError('Usuario no encontrado');
        this.router.navigate(['/app/dashboard']);
        return;
      }
      this.usuarioPerfil = usuario;

      this.esMiPerfil = this.usuarioActual?.id === usuarioId;

      // Cargar datos adicionales según el rol
      if (this.usuarioPerfil.rol === 'alumno') {
        const alumno = await this.alumnoService.getAlumnoById(usuarioId);
        this.alumnoData = alumno || null;
        if (this.alumnoData) {
          await this.cargarDatosAlumno();
        }
      } else if (this.usuarioPerfil.rol === 'profesor') {
        const docente = await this.docenteService.getDocenteById(usuarioId);
        this.docenteData = docente || null;
        if (this.docenteData) {
          await this.cargarDatosProfesor();
        }
      }

      // Inicializar formulario
      this.formData = {
        nombre: this.usuarioPerfil.nombre || '',
        apellido: this.usuarioPerfil.apellido || '',
        email: this.usuarioPerfil.email || '',
        telefono: this.usuarioPerfil.telefono || '',
        direccion: this.usuarioPerfil.direccion || '',
        fechaNacimiento: this.usuarioPerfil.fechaNacimiento || '',
        avatar: this.usuarioPerfil.avatar || '',
        especialidad: this.docenteData?.especialidad || ''
      };
    } catch (error) {
      console.error('Error cargando perfil:', error);
      this.notificationService.showError('Error al cargar el perfil');
    }
  }

  async cargarDatosAlumno(): Promise<void> {
    if (!this.alumnoData) return;

    // Cargar carrera
    if (this.alumnoData.carreraId) {
      const carreras = await this.carreraService.getCarreras();
      this.carrera = carreras.find(c => c.id === this.alumnoData!.carreraId) || null;
    }

    // Cargar materias
    const todasLasMaterias = await this.materiaService.getMaterias();
    const inscripciones = this.materiaService.getInscripcionesByAlumno(this.alumnoData.id);
    const materiasIds = inscripciones.map(i => i.materiaId);
    this.materias = todasLasMaterias.filter(m => materiasIds.includes(m.id));

    // Cargar cursos
    if (this.alumnoData.cursoId) {
      const todosLosCursos = await this.cursoService.getCursos();
      const curso = todosLosCursos.find(c => c.id === this.alumnoData!.cursoId);
      if (curso) {
        this.cursos = [curso];
      }
    } else if (this.alumnoData.cursoIds && this.alumnoData.cursoIds.length > 0) {
      const todosLosCursos = await this.cursoService.getCursos();
      this.cursos = todosLosCursos.filter(c => this.alumnoData!.cursoIds!.includes(c.id));
    }

    // Calcular estadísticas
    this.estadisticas.promedio = await this.alumnoService.getPromedioAlumno(this.alumnoData.id);
    this.estadisticas.asistencia = await this.alumnoService.getPorcentajeAsistencia(this.alumnoData.id);
    this.estadisticas.materiasInscritas = this.materias.length;
  }

  async cargarDatosProfesor(): Promise<void> {
    if (!this.docenteData) return;

    // Cargar materias asignadas
    if (this.docenteData.materiasAsignadas && this.docenteData.materiasAsignadas.length > 0) {
      const todasLasMaterias = await this.materiaService.getMaterias();
      this.materias = todasLasMaterias.filter(m => 
        this.docenteData!.materiasAsignadas!.includes(m.id)
      );
    }

    // Calcular estadísticas
    this.estadisticas.materiasAsignadas = this.materias.length;
    
    // Contar alumnos totales
    const todosLosCursos = await this.cursoService.getCursos();
    const cursosConMaterias = todosLosCursos.filter(c => 
      c.materias.some(mId => this.docenteData!.materiasAsignadas?.includes(mId))
    );
    const idsAlumnos = new Set<string>();
    cursosConMaterias.forEach(curso => {
      if (curso.alumnos) {
        curso.alumnos.forEach((alumnoId: string) => idsAlumnos.add(alumnoId));
      }
    });
    this.estadisticas.alumnosTotales = idsAlumnos.size;
  }

  activarModoEdicion(): void {
    if (!this.esMiPerfil) return;
    this.modoEdicion = true;
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    // Restaurar datos originales
    if (this.usuarioPerfil) {
      this.formData = {
        nombre: this.usuarioPerfil.nombre || '',
        apellido: this.usuarioPerfil.apellido || '',
        email: this.usuarioPerfil.email || '',
        telefono: this.usuarioPerfil.telefono || '',
        direccion: this.usuarioPerfil.direccion || '',
        fechaNacimiento: this.usuarioPerfil.fechaNacimiento || '',
        avatar: this.usuarioPerfil.avatar || '',
        especialidad: this.docenteData?.especialidad || ''
      };
    }
  }

  async guardarPerfil(): Promise<void> {
    if (!this.usuarioPerfil || !this.esMiPerfil) return;

    if (!this.formData.nombre || !this.formData.apellido || !this.formData.email) {
      this.notificationService.showError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const usuarioActualizado: Usuario = {
        ...this.usuarioPerfil,
        nombre: this.formData.nombre,
        apellido: this.formData.apellido,
        email: this.formData.email,
        telefono: this.formData.telefono,
        direccion: this.formData.direccion,
        fechaNacimiento: this.formData.fechaNacimiento,
        avatar: this.formData.avatar
      };

      await this.authService.updateUser(usuarioActualizado);

      // Si es profesor, actualizar especialidad
      if (this.usuarioPerfil.rol === 'profesor' && this.docenteData) {
        const docenteActualizado: Docente = {
          ...this.docenteData,
          especialidad: this.formData.especialidad
        };
        await this.docenteService.updateDocente(docenteActualizado);
        this.docenteData = docenteActualizado;
      }

      this.usuarioPerfil = usuarioActualizado;
      this.modoEdicion = false;
      this.notificationService.showSuccess('Perfil actualizado correctamente');
      
      // Recargar datos
      await this.cargarPerfilUsuario(this.usuarioPerfil.id);
    } catch (error) {
      console.error('Error guardando perfil:', error);
      this.notificationService.showError('Error al guardar el perfil');
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.notificationService.showError('Por favor seleccione una imagen');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.showError('La imagen no debe superar los 5MB');
        return;
      }

      // Convertir a base64 o subir a servidor
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Por ahora guardamos como base64, en producción debería subirse a un servidor
        this.formData.avatar = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getRolDisplayName(): string {
    if (!this.usuarioPerfil) return '';
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'secretario': 'Secretario',
      'profesor': 'Profesor',
      'alumno': 'Alumno',
      'coordinador': 'Coordinador'
    };
    return roles[this.usuarioPerfil.rol] || this.usuarioPerfil.rol;
  }

  getNombreCompleto(): string {
    if (!this.usuarioPerfil) return '';
    return `${this.usuarioPerfil.nombre} ${this.usuarioPerfil.apellido}`.trim();
  }

  getEdad(): number | null {
    if (!this.usuarioPerfil?.fechaNacimiento) return null;
    const fechaNac = new Date(this.usuarioPerfil.fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  }

  getNombreCurso(curso: any): string {
    if (!curso) return 'Curso Desconocido';
    if (curso.nombre) return curso.nombre;
    // Usar 'ano' sin tilde para evitar problemas de parsing
    const ano = curso.ano || (curso as any)['año'] || 1;
    const division = curso.division || 'A';
    return `${ano}° ${division}`;
  }
}

