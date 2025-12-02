import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PasswordResetService } from '../../services/password-reset.service';
import { NotificationService } from '../../services/notification.service';
import { VerifyCodeComponent } from '../verify-code/verify-code';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  codeSent = false;
  email = '';

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<ForgotPasswordComponent>,
    private dialog: MatDialog
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.notificationService.showWarning('Por favor ingresa un email válido');
      return;
    }

    this.loading = true;
    this.email = this.forgotPasswordForm.get('email')?.value;

    this.passwordResetService.requestVerificationCode(this.email).then(result => {
      this.loading = false;
      
      if (result.success) {
        this.codeSent = true;
        this.notificationService.showSuccess(result.message);
      } else {
        this.notificationService.showError(result.message);
      }
    }).catch(error => {
      this.loading = false;
      this.notificationService.showError('Error al procesar la solicitud');
      console.error('Error:', error);
    });
  }

  resendCode(): void {
    if (!this.email) return;

    this.loading = true;
    this.passwordResetService.requestVerificationCode(this.email).then(result => {
      this.loading = false;
      
      if (result.success) {
        this.notificationService.showSuccess('Código reenviado exitosamente');
      } else {
        this.notificationService.showError(result.message);
      }
    }).catch(error => {
      this.loading = false;
      this.notificationService.showError('Error al reenviar el código');
      console.error('Error:', error);
    });
  }

  continueToVerification(): void {
    // Cerrar este modal y abrir el modal de verificación
    this.dialogRef.close();
    
    const verifyDialogRef = this.dialog.open(VerifyCodeComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'verify-code-dialog-container',
      data: { email: this.email }
    });

    verifyDialogRef.afterClosed().subscribe(result => {
      // Si se verificó exitosamente, result tendrá { email, step: 'reset' }
      // El componente de verificación se encargará de abrir el siguiente modal
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getErrorMessage(field: string): string {
    const control = this.forgotPasswordForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    return '';
  }
}
