import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../services/auth.service';
import { AlumnoService } from '../../services/alumno.service';
import { DocenteService } from '../../services/docente.service';
import { CarreraService } from '../../services/carrera.service';
import { SupabaseService } from '../../services/supabase.service';
import { InstitucionService } from '../../services/institucion.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { Usuario, Docente } from '../../models/usuario.model';
import { Alumno } from '../../models/alumno.model';
import { Carrera } from '../../models/carrera.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  profesores: Docente[] = [];
  alumnos: Alumno[] = [];
  profesoresFiltrados: Docente[] = [];
  alumnosFiltrados: Alumno[] = [];
  busquedaProfesores: string = '';
  busquedaAlumnos: string = '';
  selectedTab: number = 0;
  carreras: Carrera[] = [];

  // Columnas para profesores
  displayedColumnsProfesores: string[] = ['nombre', 'email', 'username', 'password', 'dni', 'especialidad', 'materias', 'estado'];
  
  // Columnas para alumnos
  displayedColumnsAlumnos: string[] = ['nombre', 'email', 'username', 'password', 'dni', 'curso', 'carrera', 'estado'];

  constructor(
    private authService: AuthService,
    private alumnoService: AlumnoService,
    private docenteService: DocenteService,
    private carreraService: CarreraService,
    private supabase: SupabaseService,
    private institucionService: InstitucionService,
    public permissionsService: PermissionsService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.permissionsService.esAdmin() && !this.permissionsService.esSecretario()) {
      this.notificationService.showError('No tiene permisos para acceder a esta sección');
      return;
    }
    await this.loadUsuarios();
  }

  async loadUsuarios(): Promise<void> {
    try {
      // Cargar carreras primero para poder mostrar nombres
      this.carreras = await this.carreraService.getCarreras();

      // Obtener usuarios directamente desde la base de datos
      await this.loadUsuariosFromDatabase();
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      this.notificationService.showError('Error al cargar los usuarios');
    }
  }

  private async loadUsuariosFromDatabase(): Promise<void> {
    try {
      // Obtener la institución actual
      const currentInstitucion = this.institucionService.getCurrentInstitucion();
      
      // Cargar profesores directamente desde usuarios y docentes
      let profesoresQuery = this.supabase.client
        .from('usuarios')
        .select(`
          *,
          docentes(especialidad, docente_materias(materia_id))
        `)
        .eq('rol', 'profesor');

      if (currentInstitucion) {
        profesoresQuery = profesoresQuery.eq('institucion_id', currentInstitucion.id);
      }

      const { data: profesoresData, error: profesoresError } = await profesoresQuery.order('nombre', { ascending: true });

      if (profesoresError) {
        console.error('Error cargando profesores:', profesoresError);
        console.error('Detalle del error:', JSON.stringify(profesoresError, null, 2));
      } else {
        console.log('Profesores obtenidos:', profesoresData?.length || 0);
        this.profesores = (profesoresData || []).map((db: any) => {
          const docente = Array.isArray(db.docentes) ? db.docentes[0] : db.docentes;
          return {
            id: db.id,
            username: db.username || '',
            password: db.password || '',
            nombre: db.nombre || '',
            apellido: db.apellido || '',
            email: db.email || '',
            telefono: db.telefono || '',
            dni: db.dni || '',
            rol: 'profesor' as const,
            fechaRegistro: db.fecha_registro,
            activo: db.activo !== false,
            especialidad: docente?.especialidad || '',
            materiasAsignadas: (docente?.docente_materias || []).map((m: any) => m.materia_id)
          };
        });
        this.profesoresFiltrados = [...this.profesores];
        console.log('Profesores mapeados:', this.profesores.length);
      }

      // Cargar alumnos directamente desde usuarios y alumnos
      // Usar la relación específica alumnos_id_fkey para evitar ambigüedad
      let alumnosQuery = this.supabase.client
        .from('usuarios')
        .select(`
          *,
          alumnos!alumnos_id_fkey(dni, carrera_id, estado, alumno_cursos(curso_id, estado))
        `)
        .eq('rol', 'alumno');

      if (currentInstitucion) {
        alumnosQuery = alumnosQuery.eq('institucion_id', currentInstitucion.id);
      }

      const { data: alumnosData, error: alumnosError } = await alumnosQuery.order('nombre', { ascending: true });

      if (alumnosError) {
        console.error('Error cargando alumnos:', alumnosError);
        console.error('Detalle del error:', JSON.stringify(alumnosError, null, 2));
      } else {
        console.log('Alumnos obtenidos:', alumnosData?.length || 0);
        // Obtener información de cursos para cada alumno
        const alumnosConCursos = await Promise.all((alumnosData || []).map(async (db: any) => {
          const alumno = Array.isArray(db.alumnos) ? db.alumnos[0] : db.alumnos;
          const cursoIds = (alumno?.alumno_cursos || []).filter((c: any) => c.estado === 'inscrito').map((c: any) => c.curso_id);
          let cursoNombre = '';
          
          if (cursoIds.length > 0) {
            const { data: cursoData, error: cursoError } = await this.supabase.client
              .from('cursos')
              .select('año, division')
              .eq('id', cursoIds[0])
              .single();
            
            if (cursoData && !cursoError) {
              const año = (cursoData as any)['año'] || (cursoData as any).ano;
              const division = (cursoData as any).division;
              if (año && division) {
                cursoNombre = `${año}° ${division}`;
              }
            }
          }

          return {
            id: db.id,
            nombre: db.nombre || '',
            apellido: db.apellido || '',
            dni: alumno?.dni || db.dni || '',
            email: db.email || '',
            telefono: db.telefono || '',
            curso: cursoNombre,
            cursoId: cursoIds[0] || undefined,
            cursoIds: cursoIds.length > 0 ? cursoIds : undefined,
            carreraId: alumno?.carrera_id || '',
            fechaNacimiento: db.fecha_nacimiento || '',
            direccion: db.direccion || '',
            activo: db.activo !== false,
            fechaRegistro: db.fecha_registro,
            estado: alumno?.estado || 'regular',
            username: db.username || '',
            password: db.password || ''
          };
        }));

        this.alumnos = alumnosConCursos;
        this.alumnosFiltrados = [...this.alumnos];
        console.log('Alumnos mapeados:', this.alumnos.length);
      }
    } catch (error) {
      console.error('Error cargando usuarios desde base de datos:', error);
      throw error;
    }
  }

  onBusquedaProfesoresChange(): void {
    if (!this.busquedaProfesores.trim()) {
      this.profesoresFiltrados = [...this.profesores];
      return;
    }

    const busqueda = this.busquedaProfesores.toLowerCase();
    this.profesoresFiltrados = this.profesores.filter(p =>
      p.nombre.toLowerCase().includes(busqueda) ||
      p.apellido.toLowerCase().includes(busqueda) ||
      p.email.toLowerCase().includes(busqueda) ||
      p.username.toLowerCase().includes(busqueda) ||
      (p.dni && p.dni.toLowerCase().includes(busqueda))
    );
  }

  onBusquedaAlumnosChange(): void {
    if (!this.busquedaAlumnos.trim()) {
      this.alumnosFiltrados = [...this.alumnos];
      return;
    }

    const busqueda = this.busquedaAlumnos.toLowerCase();
    this.alumnosFiltrados = this.alumnos.filter(a =>
      a.nombre.toLowerCase().includes(busqueda) ||
      a.apellido.toLowerCase().includes(busqueda) ||
      a.email.toLowerCase().includes(busqueda) ||
      (a.dni && a.dni.toLowerCase().includes(busqueda))
    );
  }

  getCantidadMaterias(docente: Docente): number {
    return docente.materiasAsignadas?.length || 0;
  }

  getNombreCompleto(usuario: Usuario | Alumno): string {
    return `${usuario.nombre} ${usuario.apellido}`;
  }

  getEstadoUsuario(usuario: Usuario | Alumno): string {
    if ('activo' in usuario) {
      return usuario.activo !== false ? 'Activo' : 'Inactivo';
    }
    return 'Activo';
  }

  getEstadoChip(usuario: Usuario | Alumno): 'primary' | 'warn' {
    if ('activo' in usuario) {
      return usuario.activo !== false ? 'primary' : 'warn';
    }
    return 'primary';
  }

  copiarUsername(username: string): void {
    navigator.clipboard.writeText(username).then(() => {
      this.notificationService.showSuccess(`Usuario "${username}" copiado al portapapeles`);
    }).catch(() => {
      this.notificationService.showError('Error al copiar al portapapeles');
    });
  }

  copiarEmail(email: string): void {
    navigator.clipboard.writeText(email).then(() => {
      this.notificationService.showSuccess(`Email "${email}" copiado al portapapeles`);
    }).catch(() => {
      this.notificationService.showError('Error al copiar al portapapeles');
    });
  }

  copiarPassword(password: string): void {
    navigator.clipboard.writeText(password).then(() => {
      this.notificationService.showSuccess('Contraseña copiada al portapapeles');
    }).catch(() => {
      this.notificationService.showError('Error al copiar al portapapeles');
    });
  }

  getNombreCarrera(carreraId: string | undefined): string {
    if (!carreraId) return '-';
    const carrera = this.carreras.find(c => c.id === carreraId);
    return carrera ? carrera.nombre : carreraId;
  }

  getPassword(usuario: Usuario | Alumno | any): string {
    // Todos los usuarios ahora vienen con password desde la base de datos
    if (usuario && 'password' in usuario && usuario.password) {
      return usuario.password;
    }
    return '-';
  }

  getUsername(usuario: Usuario | Alumno | any): string {
    // Obtener username desde la base de datos
    if (usuario && 'username' in usuario && usuario.username) {
      return usuario.username;
    }
    // Para alumnos, si no hay username, usar email
    if (usuario && 'email' in usuario && usuario.email) {
      return usuario.email.split('@')[0];
    }
    return '-';
  }
}

