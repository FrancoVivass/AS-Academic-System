import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlumnoService } from '../../services/alumno.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { Alumno } from '../../models/alumno.model';

@Component({
  selector: 'app-documentacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './documentacion.component.html',
  styleUrl: './documentacion.component.css'
})
export class DocumentacionComponent implements OnInit {
  alumno: Alumno | null = null;
  documentacionForm: FormGroup;
  uploading: { [key: string]: boolean } = {};
  uploadProgress: { [key: string]: number } = {};

  constructor(
    private alumnoService: AlumnoService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.documentacionForm = this.fb.group({
      fotocopiaDni: [''],
      analitico: [''],
      aptoMedico: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadAlumno();
  }

  async loadAlumno(): Promise<void> {
    if (this.permissionsService.esAlumno()) {
      const usuarioId = this.authService.getCurrentUser()?.id;
      if (usuarioId) {
        const alumnoData = await this.alumnoService.getAlumnoById(usuarioId);
        this.alumno = alumnoData || null;
        if (this.alumno && this.alumno.documentacion) {
          this.documentacionForm.patchValue({
            fotocopiaDni: this.alumno.documentacion.fotocopiaDni || '',
            analitico: this.alumno.documentacion.analitico || '',
            aptoMedico: this.alumno.documentacion.aptoMedico || ''
          });
        }
      }
    }
  }

  async onFileSelected(event: Event, tipo: 'fotocopiaDni' | 'analitico' | 'aptoMedico'): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      this.notificationService.showError('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    // Validar tipo de archivo - Solo PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.notificationService.showError('Solo se permiten archivos PDF.');
      return;
    }

    this.uploading[tipo] = true;
    this.uploadProgress[tipo] = 0;

    try {
      // Simular carga de archivo (en producción, subir a Supabase Storage)
      const fileUrl = await this.uploadFile(file, tipo);
      
      // Actualizar formulario
      this.documentacionForm.patchValue({ [tipo]: fileUrl });
      
      // Guardar en la base de datos
      await this.guardarDocumentacion();
      
      this.notificationService.showSuccess(`${this.getTipoNombre(tipo)} cargado correctamente`);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      this.notificationService.showError('Error al subir el archivo. Por favor, intente nuevamente.');
    } finally {
      this.uploading[tipo] = false;
      this.uploadProgress[tipo] = 0;
    }
  }

  private async uploadFile(file: File, tipo: string): Promise<string> {
    // Simular progreso de carga
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // En producción, aquí subirías el archivo a Supabase Storage
        // Por ahora, simulamos una URL
        const url = `data:${file.type};base64,${(reader.result as string).split(',')[1]}`;
        resolve(url);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async guardarDocumentacion(): Promise<void> {
    if (!this.alumno) return;

    const formValue = this.documentacionForm.value;
    
    // Actualizar alumno con nueva documentación
    const alumnoActualizado: Alumno = {
      ...this.alumno,
      documentacion: {
        dniCompleto: !!formValue.fotocopiaDni,
        analiticoCompleto: !!formValue.analitico,
        aptoMedicoCompleto: !!formValue.aptoMedico,
        fotocopiaDni: formValue.fotocopiaDni,
        analitico: formValue.analitico,
        aptoMedico: formValue.aptoMedico
      }
    };

    try {
      await this.alumnoService.updateAlumno(alumnoActualizado);
      this.alumno = alumnoActualizado;
      this.notificationService.showSuccess('Documentación guardada correctamente. Será revisada por secretaría.');
    } catch (error) {
      console.error('Error guardando documentación:', error);
      this.notificationService.showError('Error al guardar la documentación. Por favor, intente nuevamente.');
    }
  }

  async enviarASecretaria(): Promise<void> {
    if (!this.alumno) return;

    const formValue = this.documentacionForm.value;
    const tieneDocumentos = formValue.fotocopiaDni || formValue.analitico || formValue.aptoMedico;

    if (!tieneDocumentos) {
      this.notificationService.showInfo('No hay documentos cargados. Recuerda que puedes presentar la documentación en persona en secretaría.');
      return;
    }

    try {
      await this.guardarDocumentacion();
      
      // Marcar como pendiente de validación (en producción, crear una solicitud)
      const documentacionActual = this.alumno.documentacion || {
        dniCompleto: false,
        analiticoCompleto: false,
        aptoMedicoCompleto: false
      };
      
      const alumnoActualizado: Alumno = {
        ...this.alumno,
        documentacion: {
          dniCompleto: documentacionActual.dniCompleto,
          analiticoCompleto: documentacionActual.analiticoCompleto,
          aptoMedicoCompleto: documentacionActual.aptoMedicoCompleto,
          fotocopiaDni: documentacionActual.fotocopiaDni,
          analitico: documentacionActual.analitico,
          aptoMedico: documentacionActual.aptoMedico,
          fechaValidacion: undefined, // Pendiente de validación
          validadoPor: undefined
        }
      };

      await this.alumnoService.updateAlumno(alumnoActualizado);
      this.alumno = alumnoActualizado;
      
      this.notificationService.showSuccess('Documentación enviada a secretaría. Será revisada próximamente.');
    } catch (error) {
      console.error('Error enviando documentación:', error);
      this.notificationService.showError('Error al enviar la documentación. Por favor, intente nuevamente.');
    }
  }

  getTipoNombre(tipo: string): string {
    const nombres: { [key: string]: string } = {
      fotocopiaDni: 'Fotocopia de DNI',
      analitico: 'Analítico',
      aptoMedico: 'Apto Médico'
    };
    return nombres[tipo] || tipo;
  }

  tieneDocumento(tipo: string): boolean {
    if (!this.alumno?.documentacion) return false;
    const formValue = this.documentacionForm.value;
    return !!formValue[tipo];
  }

  estaValidado(): boolean {
    return !!this.alumno?.documentacion?.fechaValidacion;
  }

  getEstadoValidacion(): string {
    if (!this.alumno?.documentacion) return 'Pendiente';
    if (this.alumno.documentacion.fechaValidacion) return 'Validado';
    return 'Pendiente de validación';
  }

  descargarDocumento(url: string, nombre: string): void {
    if (!url) return;
    
    // Si es una URL de datos, crear un enlace de descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.click();
  }

  eliminarDocumento(tipo: 'fotocopiaDni' | 'analitico' | 'aptoMedico'): void {
    this.documentacionForm.patchValue({ [tipo]: '' });
    this.guardarDocumentacion();
  }
}

