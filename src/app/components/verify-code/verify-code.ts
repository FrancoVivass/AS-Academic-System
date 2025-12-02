import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PasswordResetService } from '../../services/password-reset.service';
import { NotificationService } from '../../services/notification.service';
import { ResetPasswordComponent } from '../reset-password/reset-password';

@Component({
  selector: 'app-verify-code',
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
  templateUrl: './verify-code.html',
  styleUrl: './verify-code.css'
})
export class VerifyCodeComponent implements OnInit, OnDestroy {
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;
  
  verifyCodeForm: FormGroup;
  loading = false;
  email = '';
  codeVerified = false;
  countdown = 900; // 15 minutos en segundos
  countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VerifyCodeComponent>,
    private dialog: MatDialog,
    private passwordResetService: PasswordResetService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { email: string }
  ) {
    // Crear controles individuales para cada dígito
    this.verifyCodeForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      digit2: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      digit3: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      digit4: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      digit5: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      digit6: ['', [Validators.required, Validators.pattern(/[0-9]/)]]
    });

    // Auto-avanzar al siguiente campo
    this.setupAutoAdvance();
  }

  ngOnInit(): void {
    // Obtener email desde los datos del modal
    this.email = this.data?.email || '';
    if (!this.email) {
      this.notificationService.showError('Email no proporcionado');
      this.dialogRef.close();
      return;
    }

    // Iniciar countdown
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.countdownInterval);
        this.notificationService.showWarning('El código ha expirado');
      }
    }, 1000);
  }

  getCountdownFormatted(): string {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  setupAutoAdvance(): void {
    for (let i = 1; i <= 6; i++) {
      const currentField = `digit${i}`;

      this.verifyCodeForm.get(currentField)?.valueChanges.subscribe(value => {
        if (value && value.length === 1 && i < 6) {
          // Enfocar el siguiente input
          setTimeout(() => this.focusInput(i + 1), 0);
        }
      });
    }
  }

  /**
   * Enfoca el input en el índice especificado (1-6)
   */
  private focusInput(index: number): void {
    if (index < 1 || index > 6) return;
    
    // Esperar a que ViewChildren esté disponible
    setTimeout(() => {
      if (this.codeInputs && this.codeInputs.length > 0) {
        const inputIndex = index - 1; // Convertir a índice basado en 0
        const inputs = this.codeInputs.toArray();
        if (inputs[inputIndex]) {
          inputs[inputIndex].nativeElement.focus();
        }
      }
    }, 0);
  }

  getCode(): string {
    return Object.values(this.verifyCodeForm.value).join('');
  }

  onSubmit(): void {
    if (this.verifyCodeForm.invalid) {
      this.notificationService.showWarning('Por favor ingresa el código completo');
      return;
    }

    this.loading = true;
    const code = this.getCode();

    this.passwordResetService.verifyCode(this.email, code).then(result => {
      this.loading = false;
      
      if (result.valid) {
        this.codeVerified = true;
        clearInterval(this.countdownInterval);
        this.notificationService.showSuccess('Código verificado correctamente');
        
        // Cerrar este modal y abrir el modal de reset password
        setTimeout(() => {
          this.dialogRef.close({ email: this.email, step: 'reset' });
          
          const resetDialogRef = this.dialog.open(ResetPasswordComponent, {
            width: '500px',
            maxWidth: '90vw',
            disableClose: false,
            panelClass: 'reset-password-dialog-container',
            data: { email: this.email }
          });
        }, 500);
      } else {
        this.notificationService.showError(result.message || 'Código inválido');
        
        // Limpiar el formulario si hay error
        this.verifyCodeForm.reset();
        setTimeout(() => {
          this.focusInput(1);
        }, 0);
      }
    }).catch(error => {
      this.loading = false;
      this.notificationService.showError('Error al verificar el código');
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
        this.countdown = 900; // Reset countdown
        this.startCountdown();
        this.verifyCodeForm.reset();
      } else {
        this.notificationService.showError(result.message);
      }
    }).catch(error => {
      this.loading = false;
      this.notificationService.showError('Error al reenviar el código');
      console.error('Error:', error);
    });
  }

  onKeyDown(event: KeyboardEvent, currentIndex: number): void {
    if (event.key === 'Backspace') {
      const currentControl = this.verifyCodeForm.get(`digit${currentIndex}`);
      if (currentControl?.value === '' && currentIndex > 1) {
        const prevControl = this.verifyCodeForm.get(`digit${currentIndex - 1}`);
        if (prevControl) {
          prevControl.setValue('');
          setTimeout(() => this.focusInput(currentIndex - 1), 0);
        }
      }
    }
  }
}
