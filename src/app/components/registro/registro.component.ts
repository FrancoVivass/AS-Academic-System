import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthService } from '../../services/auth.service';
import { InstitucionService } from '../../services/institucion.service';
import { NotificationService } from '../../services/notification.service';
import { Institucion } from '../../models/institucion.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
  registroForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  currentInstitucion: Institucion | null = null;

  roles = [
    { value: 'secretario', label: 'Secretario/Administrador', icon: 'admin_panel_settings' },
    { value: 'admin', label: 'Administrador', icon: 'admin_panel_settings' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private institucionService: InstitucionService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.currentInstitucion = this.institucionService.getCurrentInstitucion();
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
      telefono: [''],
      fechaNacimiento: [''],
      rol: ['secretario', Validators.required]
    }, { validators: [this.passwordMatchValidator, this.emailMatchValidator] });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword) {
      if (password.value !== confirmPassword.value && confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else if (confirmPassword.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
        confirmPassword.updateValueAndValidity({ onlySelf: true });
      }
    }
    return null;
  }

  emailMatchValidator(form: FormGroup) {
    const email = form.get('email');
    const confirmEmail = form.get('confirmEmail');
    if (email && confirmEmail) {
      if (email.value !== confirmEmail.value && confirmEmail.value) {
        confirmEmail.setErrors({ emailMismatch: true });
        return { emailMismatch: true };
      } else if (confirmEmail.hasError('emailMismatch')) {
        confirmEmail.setErrors(null);
        confirmEmail.updateValueAndValidity({ onlySelf: true });
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos correctamente');
      return;
    }

    this.loading = true;
    const formValue = this.registroForm.value;
    
    // Simular registro
    setTimeout(() => {
      // Remover confirmEmail y confirmPassword antes de guardar
      const { confirmEmail, confirmPassword, ...usuarioData } = formValue;
      
      const nuevoUsuario = {
        id: Date.now().toString(),
        ...usuarioData,
        fechaRegistro: new Date().toISOString(),
        activo: true
      };
      
      // Guardar en localStorage (simulación)
      const usuarios = JSON.parse(localStorage.getItem('gestion_academica_usuarios') || '[]');
      usuarios.push(nuevoUsuario);
      localStorage.setItem('gestion_academica_usuarios', JSON.stringify(usuarios));
      
      this.notificationService.showSuccess('¡Registro exitoso! Redirigiendo al login...');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
      this.loading = false;
    }, 1000);
  }

  getErrorMessage(field: string): string {
    const control = this.registroForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('pattern')) {
      return 'Formato inválido';
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }
    if (control?.hasError('emailMismatch')) {
      return 'Los correos no coinciden';
    }
    return '';
  }

  isDarkMode = false;
  showScrollTop = false;
  whatsappNumber = '5491112345678';
  whatsappMessage = 'Hola, me interesa conocer más sobre AcademicSystem';

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showScrollTop = window.pageYOffset > 300;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openWhatsApp(): void {
    const message = encodeURIComponent(this.whatsappMessage);
    const url = `https://wa.me/${this.whatsappNumber}?text=${message}`;
    window.open(url, '_blank');
  }
}

