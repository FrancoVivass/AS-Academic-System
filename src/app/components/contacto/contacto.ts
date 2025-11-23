import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css'
})
export class ContactoComponent implements OnInit {
  contactoForm: FormGroup;
  loading = false;

  // Opciones para los selects
  tiposConsultas = [
    { value: 'consulta-general', label: 'Consulta General' },
    { value: 'demo', label: 'Solicitar Demo' },
    { value: 'soporte', label: 'Soporte Técnico' },
    { value: 'ventas', label: 'Ventas/Cotización' },
    { value: 'informacion', label: 'Información' },
    { value: 'otro', label: 'Otro' }
  ];

  tiposInstituciones = [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'terciario', label: 'Terciario/Universitario' },
    { value: 'tecnico', label: 'Instituto Técnico' },
    { value: 'otro', label: 'Otro' }
  ];

  cargos = [
    { value: 'director', label: 'Director' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'secretario', label: 'Secretario' },
    { value: 'docente', label: 'Docente' },
    { value: 'coordinador', label: 'Coordinador' },
    { value: 'otro', label: 'Otro' }
  ];

  rangosEstudiantes = [
    { value: '0-50', label: '0 - 50 estudiantes' },
    { value: '51-100', label: '51 - 100 estudiantes' },
    { value: '101-500', label: '101 - 500 estudiantes' },
    { value: '501-1000', label: '501 - 1000 estudiantes' },
    { value: '1000+', label: 'Más de 1000 estudiantes' }
  ];

  rangosDocentes = [
    { value: '0-10', label: '0 - 10 docentes' },
    { value: '11-25', label: '11 - 25 docentes' },
    { value: '26-50', label: '26 - 50 docentes' },
    { value: '50+', label: 'Más de 50 docentes' }
  ];

  preferenciasContacto = [
    { value: 'email', label: 'Email' },
    { value: 'telefono', label: 'Teléfono' },
    { value: 'ambos', label: 'Ambos' },
    { value: 'whatsapp', label: 'WhatsApp' }
  ];

  comoConocio = [
    { value: 'redes-sociales', label: 'Redes Sociales' },
    { value: 'busqueda-web', label: 'Búsqueda Web (Google, etc.)' },
    { value: 'recomendacion', label: 'Recomendación' },
    { value: 'publicidad', label: 'Publicidad' },
    { value: 'evento', label: 'Evento o Feria' },
    { value: 'otro', label: 'Otro' }
  ];

  rangosPresupuesto = [
    { value: 'menos-500', label: 'Menos de $500' },
    { value: '500-1000', label: '$500 - $1,000' },
    { value: '1000-5000', label: '$1,000 - $5,000' },
    { value: '5000-10000', label: '$5,000 - $10,000' },
    { value: '10000+', label: 'Más de $10,000' },
    { value: 'consulta', label: 'Prefiero consultar' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.contactoForm = this.fb.group({
      // Información personal
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      cargo: ['', Validators.required],
      
      // Información de la institución
      institucion: ['', [Validators.required, Validators.minLength(2)]],
      tipoInstitucion: ['', Validators.required],
      numeroEstudiantes: ['', Validators.required],
      numeroDocentes: ['', Validators.required],
      ubicacion: [''],
      sitioWeb: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      
      // Información de la consulta
      tipoConsulta: ['', Validators.required],
      asunto: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      preferenciaContacto: ['email', Validators.required],
      
      // Información adicional
      comoConocio: [''],
      presupuesto: [''],
      fechaInicio: [''],
      necesidadesEspecificas: ['']
    });
  }

  ngOnInit(): void {
    // Scroll al inicio cuando se carga la página
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  onSubmit(): void {
    if (this.contactoForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos correctamente');
      return;
    }

    this.loading = true;
    
    // Simular envío del formulario
    setTimeout(() => {
      this.notificationService.showSuccess('¡Mensaje enviado correctamente! Nos pondremos en contacto contigo pronto.');
      this.contactoForm.reset();
      this.loading = false;
    }, 1000);
  }

  getErrorMessage(field: string): string {
    const control = this.contactoForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('maxlength')) {
      return `Máximo ${control.errors?.['maxlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('pattern')) {
      if (field === 'telefono') {
        return 'Formato de teléfono inválido';
      }
      if (field === 'sitioWeb') {
        return 'Debe comenzar con http:// o https://';
      }
      return 'Formato inválido';
    }
    return '';
  }
}

