import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { AlumnoService } from '../../services/alumno.service';
import { CarreraService } from '../../services/carrera.service';
import { MateriaService } from '../../services/materia.service';
import { DocenteService } from '../../services/docente.service';
import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { ScrollLockService } from '../../services/scroll-lock.service';
import { Alumno } from '../../models/alumno.model';
import { Usuario } from '../../models/usuario.model';
import { Carrera } from '../../models/carrera.model';
import { Materia } from '../../models/materia.model';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSelectModule
  ],
  templateUrl: './alumnos.component.html',
  styleUrl: './alumnos.component.css'
})
export class AlumnosComponent implements OnInit {
  alumnos: Alumno[] = [];
  alumnosFiltrados: Alumno[] = [];
  alumnoSeleccionado: Alumno | null = null;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  busqueda: string = '';
  filtroCurso: string = '';
  alumnoForm: FormGroup;
  displayedColumns: string[] = ['nombre', 'dni', 'curso', 'promedio', 'asistencia', 'estado', 'acciones'];

  usuariosDisponibles: Usuario[] = [];
  mostrarUsuarios: boolean = false;
  mostrarModalImportar: boolean = false;
  carreras: Carrera[] = [];
  carreraSeleccionada: string = ''; // Para profesores
  materiasProfesor: Materia[] = []; // Materias del profesor

  constructor(
    private alumnoService: AlumnoService,
    private carreraService: CarreraService,
    private materiaService: MateriaService,
    private docenteService: DocenteService,
    private cursoService: CursoService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private scrollLockService: ScrollLockService
  ) {
    this.alumnoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      carreraId: ['', Validators.required],
      fechaNacimiento: [''],
      direccion: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadCarreras();
    // loadAlumnos se llama después si es profesor y hay carrera seleccionada
    if (!this.permissionsService.esProfesor() || this.carreraSeleccionada) {
      await this.loadAlumnos();
    }
  }

  async loadCarreras(): Promise<void> {
    if (this.permissionsService.esProfesor()) {
      // Para profesores: solo carreras donde tiene materias
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        // Intentar obtener docente por ID
        let docente = await this.docenteService.getDocenteById(usuario.id);
        
        // Si no se encuentra por ID, buscar por nombre
        if (!docente) {
          const todosLosDocentes = await this.docenteService.getDocentes();
          docente = todosLosDocentes.find(d => 
            d.nombre === usuario.nombre && d.apellido === usuario.apellido
          );
        }
        
        const materiasAsignadas = docente?.materiasAsignadas || [];
        const todasLasMaterias = await this.materiaService.getMaterias();
        const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
        
        // Filtrar materias del profesor
        const materiasProfesor = todasLasMaterias.filter((m: Materia) => {
          // Por materiasAsignadas si existe
          if (materiasAsignadas.length > 0) {
            return materiasAsignadas.includes(m.id);
          }
          // Fallback: por nombre del profesor
          return m.profesor === nombreProfesor || 
                 m.profesor?.includes(usuario.nombre) ||
                 m.profesor?.includes(usuario.apellido);
        });
        
        this.materiasProfesor = materiasProfesor;
        
        // Obtener carreras únicas de las materias del profesor
        const carrerasIds = new Set<string>();
        materiasProfesor.forEach((m: Materia) => {
          if (m.carreraId) {
            carrerasIds.add(m.carreraId);
          }
        });
        
        // También buscar en cursos que tienen estas materias
        const todasLasCarreras = await this.carreraService.getCarreras();
        const cursos = await this.cursoService.getCursos();
        
        cursos.forEach(curso => {
          if (curso.materias.some(mId => materiasProfesor.some(m => m.id === mId))) {
            if (curso.carreraId) {
              carrerasIds.add(curso.carreraId);
            }
          }
        });
        
        this.carreras = todasLasCarreras.filter(c => carrerasIds.has(c.id));
        
        // Si hay carreras, seleccionar la primera por defecto y cargar alumnos
        if (this.carreras.length > 0 && !this.carreraSeleccionada) {
          this.carreraSeleccionada = this.carreras[0].id;
          // Cargar alumnos después de seleccionar la carrera
          await this.loadAlumnos();
        }
      }
    } else {
      // Para admin/secretario: todas las carreras
      this.carreras = await this.carreraService.getCarreras();
    }
  }

  async onCarreraChange(): Promise<void> {
    await this.loadAlumnos();
  }

  async loadAlumnos(): Promise<void> {
    let todosLosAlumnos = await this.alumnoService.getAlumnos();
    
    // Si es profesor, filtrar solo alumnos de la carrera seleccionada
    if (this.permissionsService.esProfesor()) {
      if (this.carreraSeleccionada) {
        todosLosAlumnos = todosLosAlumnos.filter(a => 
          a.carreraId === this.carreraSeleccionada
        );
      } else {
        // Si no hay carrera seleccionada, no mostrar alumnos
        todosLosAlumnos = [];
      }
    }
    
    this.alumnos = todosLosAlumnos;
    this.aplicarFiltros();
    
    // Actualizar cache de estadísticas para todos los alumnos
    for (const alumno of this.alumnos) {
      await this.actualizarEstadisticasMateriasAlumno(alumno.id);
      await this.actualizarPromedioAlumno(alumno.id);
      await this.actualizarPorcentajeAsistenciaAlumno(alumno.id);
    }
  }

  aplicarFiltros(): void {
    let filtrados = [...this.alumnos];

    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      filtrados = filtrados.filter(a =>
        a.nombre.toLowerCase().includes(busquedaLower) ||
        a.apellido.toLowerCase().includes(busquedaLower) ||
        a.dni.includes(busquedaLower)
      );
    }

    if (this.filtroCurso) {
      filtrados = filtrados.filter(a => a.curso === this.filtroCurso);
    }

    this.alumnosFiltrados = filtrados;
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onFiltroCursoChange(): void {
    this.aplicarFiltros();
  }

  abrirModalNuevo(): void {
    if (!this.permissionsService.puedeVer('crearAlumnos')) {
      this.notificationService.showError('No tiene permisos para crear alumnos');
      return;
    }
    this.modoEdicion = false;
    this.alumnoSeleccionado = null;
    this.mostrarUsuarios = false; // Mostrar formulario, no usuarios
    this.alumnoForm.reset();
    this.mostrarModal = true;
    this.scrollLockService.lockScroll();
  }

  async cargarUsuariosDisponibles(): Promise<void> {
    const usuariosRegistrados = await this.authService.getUsuariosByRol('alumno');
    const alumnosAsociados = await this.alumnoService.getAlumnos();
    const idsAsociados = alumnosAsociados.map((a: Alumno) => a.id);
    
    // Filtrar usuarios que no están asociados como alumnos
    this.usuariosDisponibles = usuariosRegistrados.filter((u: Usuario) => !idsAsociados.includes(u.id));
  }

  async asociarUsuario(usuario: Usuario): Promise<void> {
    const nuevoAlumno: Alumno = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni || '',
      email: usuario.email,
      telefono: usuario.telefono || '',
      curso: '', // Se asignará después cuando se inscriba a un curso
      carreraId: '', // Se puede asignar después
      fechaNacimiento: usuario.fechaNacimiento || '',
      direccion: usuario.direccion || '',
      estado: 'regular',
      fechaRegistro: new Date().toISOString(),
      documentacion: {
        dniCompleto: false,
        analiticoCompleto: false,
        aptoMedicoCompleto: false
      },
      historialEstados: [{
        estado: 'regular',
        fecha: new Date().toISOString()
      }]
    };
    
    await this.alumnoService.addAlumno(nuevoAlumno);
    this.notificationService.showSuccess(`Alumno ${usuario.nombre} ${usuario.apellido} asociado correctamente`);
    await this.loadAlumnos();
    this.mostrarUsuarios = false;
    this.cerrarModal();
  }

  abrirModalEditar(alumno: Alumno): void {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para editar alumnos');
      return;
    }
    this.modoEdicion = true;
    this.alumnoSeleccionado = alumno;
    this.mostrarUsuarios = false;
    this.alumnoForm.patchValue(alumno);
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.alumnoSeleccionado = null;
    this.modoEdicion = false;
    this.alumnoForm.reset();
    this.scrollLockService.unlockScroll();
  }

  async guardarAlumno(): Promise<void> {
    if (this.alumnoForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.alumnoForm.value;
    
    if (this.modoEdicion && this.alumnoSeleccionado) {
      const alumnoActualizado: Alumno = {
        ...this.alumnoSeleccionado,
        ...formValue
      };
      await this.alumnoService.updateAlumno(alumnoActualizado);
      this.notificationService.showSuccess('Alumno actualizado correctamente');
    } else {
      const nuevoAlumno: Alumno = {
        id: Date.now().toString(),
        ...formValue,
        curso: '', // Se asignará después cuando se inscriba a un curso
        estado: 'regular',
        fechaRegistro: new Date().toISOString(),
        documentacion: {
          dniCompleto: false,
          analiticoCompleto: false,
          aptoMedicoCompleto: false
        },
        historialEstados: [{
          estado: 'regular',
          fecha: new Date().toISOString()
        }]
      };
      await this.alumnoService.addAlumno(nuevoAlumno);
      
      // Crear usuario para que pueda iniciar sesión
      const nuevoUsuario: Usuario = {
        id: nuevoAlumno.id,
        username: formValue.email.split('@')[0] || `alumno_${nuevoAlumno.id}`,
        password: formValue.dni || '1234', // Password temporal basado en DNI
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        email: formValue.email,
        telefono: formValue.telefono,
        dni: formValue.dni,
        fechaNacimiento: formValue.fechaNacimiento,
        direccion: formValue.direccion,
        rol: 'alumno',
        fechaRegistro: new Date().toISOString(),
        activo: true
      };
      
      const usuarios = await this.authService.getUsuarios();
      usuarios.push(nuevoUsuario);
      localStorage.setItem('gestion_academica_usuarios', JSON.stringify(usuarios));
      
      this.notificationService.showSuccess(`Alumno creado correctamente. Usuario: ${nuevoUsuario.username}, Password: ${nuevoUsuario.password}`);
    }

    await this.loadAlumnos();
    this.cerrarModal();
  }

  async eliminarAlumno(id: string): Promise<void> {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para desasociar alumnos');
      return;
    }
    if (confirm('¿Está seguro de desasociar este alumno?')) {
      await this.alumnoService.deleteAlumno(id);
      await this.loadAlumnos();
      this.notificationService.showSuccess('Alumno desasociado correctamente');
    }
  }


  getCursosUnicos(): string[] {
    const cursos = this.alumnos.map(a => a.curso).filter((c, i, arr) => arr.indexOf(c) === i);
    return cursos.sort();
  }

  getPromedioAlumno(id: string): number {
    return this.promediosCache.get(id) || 0;
  }

  async actualizarPromedioAlumno(id: string): Promise<void> {
    let promedio: number;
    // Si es profesor, calcular promedio solo de sus materias
    if (this.permissionsService.esProfesor() && this.carreraSeleccionada) {
      promedio = await this.getPromedioAlumnoPorMateriasProfesor(id);
    } else {
      promedio = await this.alumnoService.getPromedioAlumno(id);
    }
    this.promediosCache.set(id, promedio);
  }

  getPorcentajeAsistenciaAlumno(id: string): number {
    return this.porcentajesAsistenciaCache.get(id) || 0;
  }

  async actualizarPorcentajeAsistenciaAlumno(id: string): Promise<void> {
    let porcentaje: number;
    // Si es profesor, calcular asistencia solo de sus materias
    if (this.permissionsService.esProfesor() && this.carreraSeleccionada) {
      porcentaje = await this.getPorcentajeAsistenciaPorMateriasProfesor(id);
    } else {
      porcentaje = await this.alumnoService.getPorcentajeAsistencia(id);
    }
    this.porcentajesAsistenciaCache.set(id, porcentaje);
  }

  async getPromedioAlumnoPorMateriasProfesor(alumnoId: string): Promise<number> {
    if (!this.carreraSeleccionada || this.materiasProfesor.length === 0) {
      return 0;
    }

    const materiasIds = this.materiasProfesor
      .filter(m => m.carreraId === this.carreraSeleccionada)
      .map(m => m.id);

    const todasLasNotas = await this.alumnoService.getNotasByAlumno(alumnoId);
    const notas = todasLasNotas.filter((n: any) => materiasIds.includes(n.materiaId));

    if (notas.length === 0) return 0;

    const suma = notas.reduce((acc: number, nota: any) => acc + nota.calificacion, 0);
    return Math.round((suma / notas.length) * 100) / 100;
  }

  async getPorcentajeAsistenciaPorMateriasProfesor(alumnoId: string): Promise<number> {
    if (!this.carreraSeleccionada || this.materiasProfesor.length === 0) {
      return 0;
    }

    const materiasIds = this.materiasProfesor
      .filter(m => m.carreraId === this.carreraSeleccionada)
      .map(m => m.id);

    const asistencias = await this.alumnoService.getAsistenciasByAlumno(alumnoId);
    const asistenciasFiltradas = asistencias.filter((a: any) => materiasIds.includes(a.materiaId));

    if (asistenciasFiltradas.length === 0) return 0;

    const presentes = asistenciasFiltradas.filter((a: any) => a.presente || a.estado === 'presente').length;
    return Math.round((presentes / asistenciasFiltradas.length) * 100);
  }

  private estadisticasMateriasCache: Map<string, { materia: string; promedio: number; asistencia: number }[]> = new Map();
  private promediosCache: Map<string, number> = new Map();
  private porcentajesAsistenciaCache: Map<string, number> = new Map();

  getEstadisticasMateriasAlumno(alumnoId: string): { materia: string; promedio: number; asistencia: number }[] {
    return this.estadisticasMateriasCache.get(alumnoId) || [];
  }

  async actualizarEstadisticasMateriasAlumno(alumnoId: string): Promise<void> {
    const estadisticas = await this.calcularEstadisticasMateriasAlumno(alumnoId);
    this.estadisticasMateriasCache.set(alumnoId, estadisticas);
  }

  private async calcularEstadisticasMateriasAlumno(alumnoId: string): Promise<{ materia: string; promedio: number; asistencia: number }[]> {
    if (!this.carreraSeleccionada || this.materiasProfesor.length === 0) {
      return [];
    }

    const materiasCarrera = this.materiasProfesor.filter(m => m.carreraId === this.carreraSeleccionada);

    const estadisticasPromises = materiasCarrera.map(async (materia) => {
      const todasLasNotas = await this.alumnoService.getNotasByAlumno(alumnoId);
      const notas = todasLasNotas.filter((n: any) => n.materiaId === materia.id);
      const promedio = notas.length > 0
        ? Math.round((notas.reduce((acc: number, n: any) => acc + n.calificacion, 0) / notas.length) * 100) / 100
        : 0;

      const todasLasAsistencias = await this.alumnoService.getAsistenciasByAlumno(alumnoId);
      const asistencias = todasLasAsistencias.filter((a: any) => a.materiaId === materia.id);
      const asistencia = asistencias.length > 0
        ? Math.round((asistencias.filter((a: any) => a.presente || a.estado === 'presente').length / asistencias.length) * 100)
        : 0;

      return {
        materia: materia.nombre,
        promedio,
        asistencia
      };
    });
    const estadisticas = await Promise.all(estadisticasPromises);
    
    return estadisticas;
  }

  getCantidadRegulares(): number {
    return this.alumnos.filter(a => {
      const promedio = this.getPromedioAlumno(a.id);
      const asistencia = this.getPorcentajeAsistenciaAlumno(a.id);
      return promedio >= 6 && asistencia >= 75;
    }).length;
  }

  getCantidadIrregulares(): number {
    return this.alumnos.length - this.getCantidadRegulares();
  }

  getColorEstado(estado?: string): 'primary' | 'accent' | 'warn' {
    switch (estado) {
      case 'regular': return 'primary';
      case 'irregular': return 'warn';
      case 'egresado': return 'accent';
      case 'expulsado': return 'warn';
      case 'suspendido': return 'warn';
      case 'libre': return 'accent';
      default: return 'primary';
    }
  }

  getPromedioGeneral(): number {
    if (this.alumnos.length === 0) return 0;
    const promedios = this.alumnos.map(a => this.getPromedioAlumno(a.id)).filter(p => p > 0);
    if (promedios.length === 0) return 0;
    return Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100) / 100;
  }

  async cambiarEstadoAlumno(alumno: Alumno): Promise<void> {
    const estados: ('regular' | 'irregular' | 'egresado' | 'expulsado' | 'suspendido' | 'libre')[] = 
      ['regular', 'irregular', 'egresado', 'expulsado', 'suspendido', 'libre'];
    const estadoActual = alumno.estado || 'regular';
    const indiceActual = estados.indexOf(estadoActual);
    const nuevoEstado = estados[(indiceActual + 1) % estados.length];
    
    const alumnoActualizado: Alumno = {
      ...alumno,
      estado: nuevoEstado,
      historialEstados: [
        ...(alumno.historialEstados || []),
        {
          estado: nuevoEstado,
          fecha: new Date().toISOString(),
          cambiadoPor: this.authService.getCurrentUser()?.id
        }
      ]
    };
    
    await this.alumnoService.updateAlumno(alumnoActualizado);
    this.notificationService.showSuccess(`Estado cambiado a: ${nuevoEstado}`);
    await this.loadAlumnos();
  }

  async validarDocumentacion(alumno: Alumno): Promise<void> {
    const documentacion = alumno.documentacion || {
      dniCompleto: false,
      analiticoCompleto: false,
      aptoMedicoCompleto: false
    };
    
    documentacion.dniCompleto = true;
    documentacion.analiticoCompleto = true;
    documentacion.aptoMedicoCompleto = true;
    documentacion.fechaValidacion = new Date().toISOString();
    documentacion.validadoPor = this.authService.getCurrentUser()?.id;
    
    const alumnoActualizado: Alumno = {
      ...alumno,
      documentacion
    };
    
    await this.alumnoService.updateAlumno(alumnoActualizado);
    this.notificationService.showSuccess('Documentación validada correctamente');
    await this.loadAlumnos();
  }

  importarAlumnos(): void {
    this.mostrarModalImportar = true;
    this.scrollLockService.lockScroll();
  }

  cerrarModalImportar(): void {
    this.mostrarModalImportar = false;
    this.scrollLockService.unlockScroll();
  }

  descargarFormatoExcel(): void {
    // Crear un archivo Excel de ejemplo
    const formato = [
      ['Nombre', 'Apellido', 'DNI', 'Email', 'Teléfono', 'Carrera', 'Fecha Nacimiento', 'Dirección']
    ];
    
    const csv = formato.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'formato_importacion_alumnos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.showSuccess('Formato descargado correctamente');
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.notificationService.showError('Por favor seleccione un archivo CSV o Excel');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      this.procesarArchivoExcel(text);
    };
    reader.readAsText(file);
  }

  async procesarArchivoExcel(text: string): Promise<void> {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      this.notificationService.showError('El archivo está vacío o no tiene el formato correcto');
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['Nombre', 'Apellido', 'DNI', 'Email', 'Carrera'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      this.notificationService.showError(`Faltan las siguientes columnas: ${missingHeaders.join(', ')}`);
      return;
    }
    
    let importados = 0;
    let errores = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      
      const alumnoData: any = {};
      headers.forEach((header, index) => {
        alumnoData[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
      });
      
      try {
        // Buscar carrera por nombre
        const nombreCarrera = alumnoData.carrera || '';
        const carrera = this.carreras.find(c => c.nombre.toLowerCase() === nombreCarrera.toLowerCase());
        const carreraId = carrera ? carrera.id : '';
        
        if (!carreraId && nombreCarrera) {
          this.notificationService.showWarning(`Carrera "${nombreCarrera}" no encontrada para el alumno ${alumnoData.nombre} ${alumnoData.apellido}`);
        }
        
        const nuevoAlumno: Alumno = {
          id: Date.now().toString() + i,
          nombre: alumnoData.nombre || '',
          apellido: alumnoData.apellido || '',
          dni: alumnoData.dni || '',
          email: alumnoData.email || '',
          telefono: alumnoData.teléfono || alumnoData.telefono || '',
          curso: '', // Se asignará después cuando se inscriba a un curso
          carreraId: carreraId,
          fechaNacimiento: alumnoData.fechanacimiento || '',
          direccion: alumnoData.dirección || alumnoData.direccion || '',
          estado: 'regular',
          fechaRegistro: new Date().toISOString(),
          documentacion: {
            dniCompleto: false,
            analiticoCompleto: false,
            aptoMedicoCompleto: false
          },
          historialEstados: [{
            estado: 'regular',
            fecha: new Date().toISOString()
          }]
        };
        
        // Crear usuario para que pueda iniciar sesión
        const nuevoUsuario: Usuario = {
          id: nuevoAlumno.id,
          username: nuevoAlumno.email.split('@')[0] || `alumno_${nuevoAlumno.id}`,
          password: nuevoAlumno.dni || '1234',
          nombre: nuevoAlumno.nombre,
          apellido: nuevoAlumno.apellido,
          email: nuevoAlumno.email,
          telefono: nuevoAlumno.telefono,
          dni: nuevoAlumno.dni,
          fechaNacimiento: nuevoAlumno.fechaNacimiento,
          direccion: nuevoAlumno.direccion,
          rol: 'alumno',
          fechaRegistro: new Date().toISOString(),
          activo: true
        };
        
        await this.alumnoService.addAlumno(nuevoAlumno);
        const usuarios = await this.authService.getUsuarios();
        usuarios.push(nuevoUsuario);
        localStorage.setItem('gestion_academica_usuarios', JSON.stringify(usuarios));
        
        importados++;
      } catch (error) {
        errores++;
      }
    }
    
    this.notificationService.showSuccess(`Importación completada: ${importados} alumnos importados${errores > 0 ? `, ${errores} errores` : ''}`);
    await this.loadAlumnos();
    this.cerrarModalImportar();
  }

  async mostrarUsuariosDisponibles(): Promise<void> {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para asociar alumnos');
      return;
    }
    await this.cargarUsuariosDisponibles();
    this.mostrarUsuarios = true;
    this.mostrarModal = true;
    this.scrollLockService.lockScroll();
  }
}

