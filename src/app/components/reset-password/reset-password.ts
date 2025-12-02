import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PasswordResetService } from '../../services/password-reset.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  loading = false;
  email = '';
  codeVerified = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public dialogRef: MatDialogRef<ResetPasswordComponent>,
    private passwordResetService: PasswordResetService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { email: string }
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Obtener email desde los datos del modal
    this.email = this.data?.email || '';
    if (!this.email) {
      this.notificationService.showError('Email no proporcionado');
      this.dialogRef.close();
      return;
    }

    // Verificar que hay un código verificado
    this.checkVerifiedCode();
  }

  async checkVerifiedCode(): Promise<void> {
    const codeInfo = await this.passwordResetService.getVerifiedCodeInfo(this.email);
    if (!codeInfo.valid) {
      this.notificationService.showError(codeInfo.message || 'Debes verificar el código primero');
      this.dialogRef.close();
      return;
    }
    this.codeVerified = true;
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

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.notificationService.showWarning('Por favor completa todos los campos correctamente');
      return;
    }

    if (!this.codeVerified) {
      this.notificationService.showError('Debes verificar el código primero');
      this.router.navigate(['/verify-code'], { queryParams: { email: this.email } });
      return;
    }

    this.loading = true;
    const newPassword = this.resetPasswordForm.get('password')?.value;

    this.passwordResetService.resetPassword(this.email, newPassword).then(result => {
      this.loading = false;
      
      if (result.success) {
        this.notificationService.showSuccess(result.message);
        // Cerrar el modal y redirigir al login después de 2 segundos
        setTimeout(() => {
          this.dialogRef.close({ success: true });
          this.router.navigate(['/login']);
        }, 2000);
      } else {
        this.notificationService.showError(result.message);
      }
    }).catch(error => {
      this.loading = false;
      this.notificationService.showError('Error al restablecer la contraseña');
      console.error('Error:', error);
    });
  }

  getErrorMessage(field: string): string {
    const control = this.resetPasswordForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }
}
