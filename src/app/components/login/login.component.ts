import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InstitucionService } from '../../services/institucion.service';
import { NotificationService } from '../../services/notification.service';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password';
import { Institucion } from '../../models/institucion.model';

@Component({
  selector: 'app-login',
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
    MatSnackBarModule,
    MatDialogModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  currentInstitucion: Institucion | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private institucionService: InstitucionService,
    private router: Router,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/app/dashboard']);
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos correctamente');
      return;
    }

    this.loading = true;
    const { username, password } = this.loginForm.value;

    setTimeout(async () => {
      if (await this.authService.login(username, password)) {
        this.notificationService.showSuccess('¡Bienvenido!');
        this.router.navigate(['/app/dashboard']);
      } else {
        this.notificationService.showError('Usuario o contraseña incorrectos');
      }
      this.loading = false;
    }, 500);
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    
    const dialogRef = this.dialog.open(ForgotPasswordComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'forgot-password-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Los modales se manejan internamente, no hay necesidad de navegar
      // El flujo es: forgot-password -> verify-code -> reset-password (todo en modales)
    });
  }
}
