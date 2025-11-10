import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InstitucionService } from '../../services/institucion.service';
import { Institucion } from '../../models/institucion.model';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-seleccion-institucion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule
  ],
  templateUrl: './seleccion-institucion.html',
  styleUrl: './seleccion-institucion.css'
})
export class SeleccionInstitucionComponent implements OnInit, OnDestroy {
  instituciones: Institucion[] = [];
  institucionSeleccionada: Institucion | null = null;
  credencialForm: FormGroup;
  mostrarCredencial = false;
  private institucionesSubscription?: Subscription;

  constructor(
    private institucionService: InstitucionService,
    private router: Router,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.credencialForm = this.fb.group({
      credencial: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    // Forzar actualización de instituciones al cargar el componente
    this.institucionService.refreshInstituciones();
    this.loadInstituciones();
    
    // Suscribirse a cambios en las instituciones
    this.institucionesSubscription = this.institucionService.instituciones$.subscribe(instituciones => {
      this.instituciones = instituciones.filter(i => i.activa);
    });
  }

  ngOnDestroy(): void {
    if (this.institucionesSubscription) {
      this.institucionesSubscription.unsubscribe();
    }
  }

  loadInstituciones(): void {
    this.instituciones = this.institucionService.getInstitucionActiva();
  }

  seleccionarInstitucion(institucion: Institucion): void {
    // Obtener la versión actualizada de la institución desde el servicio
    const institucionActualizada = this.institucionService.getInstitucionById(institucion.id);
    this.institucionSeleccionada = institucionActualizada || institucion;
    this.mostrarCredencial = true;
    this.credencialForm.reset();
  }

  cancelarSeleccion(): void {
    this.institucionSeleccionada = null;
    this.mostrarCredencial = false;
    this.credencialForm.reset();
  }

  verificarCredencial(): void {
    if (this.credencialForm.valid && this.institucionSeleccionada) {
      const credencial = this.credencialForm.get('credencial')?.value;
      
      // Asegurarse de tener la versión más actualizada de la institución
      const institucionActualizada = this.institucionService.getInstitucionById(this.institucionSeleccionada.id);
      const institucionParaUsar = institucionActualizada || this.institucionSeleccionada;
      
      if (this.institucionService.verificarCredencial(institucionParaUsar.id, credencial)) {
        this.institucionService.setCurrentInstitucion(institucionParaUsar);
        this.notificationService.showSuccess(`Credencial verificada. Redirigiendo a ${institucionParaUsar.nombre}...`);
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      } else {
        this.notificationService.showError('Credencial incorrecta. Por favor, inténtalo de nuevo.');
        this.credencialForm.get('credencial')?.reset();
      }
    }
  }

  irAContacto(): void {
    this.router.navigate(['/'], { fragment: 'contacto' });
  }
}
