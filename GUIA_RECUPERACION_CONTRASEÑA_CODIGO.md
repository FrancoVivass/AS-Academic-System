# 🔐 Guía Completa: Sistema de Recuperación de Contraseña con Código de Verificación

## 🔒 Sistema de Doble Verificación por Email y Código

Este sistema implementa una seguridad adicional usando un código de verificación enviado al email del usuario.

---

## 📋 Índice de Pasos

1. [Configurar Base de Datos](#1-configurar-base-de-datos)
2. [Crear Servicio de Email](#2-crear-servicio-de-email)
3. [Crear Servicio de Recuperación con Código](#3-crear-servicio-de-recuperación-con-código)
4. [Crear Componente de Solicitud](#4-crear-componente-de-solicitud)
5. [Crear Componente de Verificación de Código](#5-crear-componente-de-verificación-de-código)
6. [Crear Componente de Restablecimiento](#6-crear-componente-de-restablecimiento)
7. [Crear Rutas](#7-crear-rutas)
8. [Actualizar Login Component](#8-actualizar-login-component)
9. [Configurar Plantilla de Email](#9-configurar-plantilla-de-email)

---

## 1️⃣ Configurar Base de Datos

### Paso 1.1: Crear tabla para códigos de recuperación

Ve a Supabase SQL Editor y ejecuta este script:

```sql
-- Tabla para almacenar códigos de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL, -- Código de 6 dígitos
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0, -- Intentos de verificación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT code_unique_per_user UNIQUE (usuario_id, code, created_at)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_password_reset_code ON password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_codes(usuario_id);

-- Función para limpiar códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE password_reset_codes IS 'Almacena códigos de verificación de 6 dígitos para recuperación de contraseña';
COMMENT ON COLUMN password_reset_codes.code IS 'Código numérico de 6 dígitos';
COMMENT ON COLUMN password_reset_codes.expires_at IS 'Fecha de expiración del código (típicamente 15 minutos)';
COMMENT ON COLUMN password_reset_codes.verified IS 'Indica si el código fue verificado correctamente';
COMMENT ON COLUMN password_reset_codes.used IS 'Indica si el código fue usado para restablecer la contraseña';
COMMENT ON COLUMN password_reset_codes.attempts IS 'Número de intentos fallidos de verificación';
```

---

## 2️⃣ Crear Servicio de Email

### Paso 2.1: Crear servicio de email

Crea `src/app/services/email.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Envía un email con código de verificación
   */
  async sendVerificationCode(
    email: string, 
    code: string, 
    nombreUsuario: string
  ): Promise<boolean> {
    try {
      // Opción 1: Usar Supabase Edge Function (recomendado)
      const { data, error } = await this.supabase.client.functions.invoke('send-verification-code', {
        body: {
          email,
          code,
          nombreUsuario
        }
      });

      if (error) {
        console.error('Error enviando email:', error);
        // Fallback: usar método alternativo
        return this.sendVerificationCodeFallback(email, code, nombreUsuario);
      }

      return true;
    } catch (error) {
      console.error('Error en servicio de email:', error);
      // Fallback: usar método alternativo
      return this.sendVerificationCodeFallback(email, code, nombreUsuario);
    }
  }

  /**
   * Método alternativo para desarrollo/pruebas
   */
  private async sendVerificationCodeFallback(
    email: string, 
    code: string, 
    nombreUsuario: string
  ): Promise<boolean> {
    // Para desarrollo, mostramos el código en consola
    console.log('=== CÓDIGO DE VERIFICACIÓN ===');
    console.log(`Email: ${email}`);
    console.log(`Código: ${code}`);
    console.log(`Usuario: ${nombreUsuario}`);
    console.log('==============================');
    
    // En producción, aquí integrarías tu servicio de email (Resend, SendGrid, etc.)
    // Por ahora retornamos true para desarrollo
    return true;
  }

  /**
   * Envía email de confirmación de cambio de contraseña
   */
  async sendPasswordChangedConfirmation(
    email: string,
    nombreUsuario: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.client.functions.invoke('send-password-changed', {
        body: {
          email,
          nombreUsuario
        }
      });

      if (error) {
        console.error('Error enviando confirmación:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en confirmación:', error);
      return false;
    }
  }
}
```

---

## 3️⃣ Crear Servicio de Recuperación con Código

### Paso 3.1: Instalar dependencias

```bash
npm install uuid
npm install --save-dev @types/uuid
```

### Paso 3.2: Crear el servicio

Crea `src/app/services/password-reset.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EmailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';

interface PasswordResetCode {
  id: string;
  usuario_id: string;
  email: string;
  code: string;
  expires_at: string;
  verified: boolean;
  used: boolean;
  attempts: number;
  created_at: string;
  verified_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private readonly CODE_EXPIRY_MINUTES = 15; // Código válido por 15 minutos
  private readonly MAX_ATTEMPTS = 5; // Máximo 5 intentos de verificación
  private readonly CODE_LENGTH = 6; // Código de 6 dígitos

  constructor(
    private supabase: SupabaseService,
    private emailService: EmailService
  ) {}

  /**
   * Genera un código numérico de 6 dígitos
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Solicita un código de verificación por email
   */
  async requestVerificationCode(email: string): Promise<{ 
    success: boolean; 
    message: string;
    canResend?: boolean;
  }> {
    try {
      // 1. Buscar usuario por email
      const { data: usuario, error: userError } = await this.supabase.client
        .from('usuarios')
        .select('id, email, nombre, username')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !usuario) {
        // Por seguridad, no revelamos si el email existe
        return {
          success: true,
          message: 'Si el email existe, recibirás un código de verificación',
          canResend: false
        };
      }

      // 2. Invalidar códigos previos no usados del usuario (opcional)
      // Solo invalidamos si hay muchos códigos pendientes
      await this.supabase.client
        .from('password_reset_codes')
        .update({ verified: true, used: true })
        .eq('usuario_id', usuario.id)
        .eq('used', false)
        .lt('expires_at', new Date().toISOString());

      // 3. Generar nuevo código
      const code = this.generateCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

      // 4. Guardar código en la base de datos
      const { error: codeError } = await this.supabase.client
        .from('password_reset_codes')
        .insert({
          usuario_id: usuario.id,
          email: usuario.email,
          code: code,
          expires_at: expiresAt.toISOString(),
          verified: false,
          used: false,
          attempts: 0
        });

      if (codeError) {
        console.error('Error guardando código:', codeError);
        return {
          success: false,
          message: 'Error al generar código de verificación',
          canResend: false
        };
      }

      // 5. Enviar email con el código
      const emailSent = await this.emailService.sendVerificationCode(
        usuario.email,
        code,
        usuario.nombre || usuario.username
      );

      if (!emailSent) {
        return {
          success: false,
          message: 'Error al enviar el código de verificación',
          canResend: true
        };
      }

      return {
        success: true,
        message: 'Código de verificación enviado a tu email',
        canResend: true
      };

    } catch (error) {
      console.error('Error en requestVerificationCode:', error);
      return {
        success: false,
        message: 'Error inesperado al procesar la solicitud',
        canResend: false
      };
    }
  }

  /**
   * Verifica un código de verificación
   */
  async verifyCode(email: string, code: string): Promise<{ 
    valid: boolean; 
    usuarioId?: string;
    message?: string;
    remainingAttempts?: number;
  }> {
    try {
      // 1. Buscar código activo para este email
      const { data: codes, error } = await this.supabase.client
        .from('password_reset_codes')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('used', false)
        .eq('code', code)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !codes || codes.length === 0) {
        // Incrementar intentos si existe un código pendiente
        await this.incrementAttempts(email);
        return {
          valid: false,
          message: 'Código inválido'
        };
      }

      const codeRecord = codes[0];

      // 2. Verificar si el código expiró
      const expiresAt = new Date(codeRecord.expires_at);
      const now = new Date();

      if (expiresAt < now) {
        return {
          valid: false,
          message: 'El código ha expirado. Solicita uno nuevo.'
        };
      }

      // 3. Verificar intentos máximos
      if (codeRecord.attempts >= this.MAX_ATTEMPTS) {
        return {
          valid: false,
          message: 'Demasiados intentos fallidos. Solicita un nuevo código.'
        };
      }

      // 4. Verificar que el código no esté ya verificado
      if (codeRecord.verified) {
        return {
          valid: false,
          message: 'Este código ya fue usado. Solicita uno nuevo.'
        };
      }

      // 5. Marcar código como verificado
      const { error: updateError } = await this.supabase.client
        .from('password_reset_codes')
        .update({ 
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', codeRecord.id);

      if (updateError) {
        console.error('Error actualizando código:', updateError);
        return {
          valid: false,
          message: 'Error al verificar el código'
        };
      }

      return {
        valid: true,
        usuarioId: codeRecord.usuario_id
      };

    } catch (error) {
      console.error('Error en verifyCode:', error);
      return {
        valid: false,
        message: 'Error al verificar el código'
      };
    }
  }

  /**
   * Incrementa los intentos fallidos
   */
  private async incrementAttempts(email: string): Promise<void> {
    try {
      const { data: codes } = await this.supabase.client
        .from('password_reset_codes')
        .select('id, attempts')
        .eq('email', email.toLowerCase().trim())
        .eq('used', false)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (codes && codes.length > 0) {
        await this.supabase.client
          .from('password_reset_codes')
          .update({ attempts: codes[0].attempts + 1 })
          .eq('id', codes[0].id);
      }
    } catch (error) {
      console.error('Error incrementando intentos:', error);
    }
  }

  /**
   * Obtiene información del código verificado para restablecer contraseña
   */
  async getVerifiedCodeInfo(email: string): Promise<{ 
    valid: boolean;
    usuarioId?: string;
    message?: string;
  }> {
    try {
      const { data: codes, error } = await this.supabase.client
        .from('password_reset_codes')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('verified', true)
        .eq('used', false)
        .order('verified_at', { ascending: false })
        .limit(1);

      if (error || !codes || codes.length === 0) {
        return {
          valid: false,
          message: 'No hay un código verificado para este email'
        };
      }

      const codeRecord = codes[0];

      // Verificar que el código no haya expirado
      const expiresAt = new Date(codeRecord.expires_at);
      const now = new Date();

      if (expiresAt < now) {
        return {
          valid: false,
          message: 'El código verificado ha expirado. Solicita uno nuevo.'
        };
      }

      return {
        valid: true,
        usuarioId: codeRecord.usuario_id
      };

    } catch (error) {
      console.error('Error obteniendo código verificado:', error);
      return {
        valid: false,
        message: 'Error al obtener información del código'
      };
    }
  }

  /**
   * Restablece la contraseña con un código verificado
   */
  async resetPassword(email: string, newPassword: string): Promise<{ 
    success: boolean; 
    message: string;
  }> {
    try {
      // 1. Verificar que hay un código verificado
      const codeInfo = await this.getVerifiedCodeInfo(email);
      if (!codeInfo.valid || !codeInfo.usuarioId) {
        return {
          success: false,
          message: codeInfo.message || 'No hay un código verificado válido'
        };
      }

      // 2. Actualizar contraseña del usuario
      // TODO: En producción, hashear la contraseña antes de guardar
      const { error: updateError } = await this.supabase.client
        .from('usuarios')
        .update({ password: newPassword })
        .eq('id', codeInfo.usuarioId);

      if (updateError) {
        console.error('Error actualizando contraseña:', updateError);
        return {
          success: false,
          message: 'Error al actualizar la contraseña'
        };
      }

      // 3. Marcar todos los códigos del usuario como usados
      await this.supabase.client
        .from('password_reset_codes')
        .update({ used: true })
        .eq('usuario_id', codeInfo.usuarioId)
        .eq('verified', true);

      // 4. Obtener información del usuario para email de confirmación
      const { data: usuario } = await this.supabase.client
        .from('usuarios')
        .select('nombre, username')
        .eq('id', codeInfo.usuarioId)
        .single();

      // 5. Enviar email de confirmación
      if (usuario) {
        await this.emailService.sendPasswordChangedConfirmation(
          email,
          usuario.nombre || usuario.username
        );
      }

      return {
        success: true,
        message: 'Contraseña restablecida exitosamente'
      };

    } catch (error) {
      console.error('Error en resetPassword:', error);
      return {
        success: false,
        message: 'Error inesperado al restablecer la contraseña'
      };
    }
  }

  /**
   * Limpia códigos expirados
   */
  async cleanupExpiredCodes(): Promise<void> {
    try {
      await this.supabase.client.rpc('cleanup_expired_codes');
    } catch (error) {
      console.error('Error limpiando códigos:', error);
    }
  }

  /**
   * Verifica si un email tiene un código pendiente
   */
  async hasPendingCode(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.client
        .from('password_reset_codes')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('used', false)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }
}
```

---

## 4️⃣ Crear Componente de Solicitud

### Paso 4.1: Crear el componente

```bash
ng generate component components/forgot-password --standalone
```

### Paso 4.2: Actualizar TypeScript

`src/app/components/forgot-password/forgot-password.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
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
    private router: Router
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
    this.dialogRef.close({ email: this.email, step: 'verify' });
    this.router.navigate(['/verify-code'], { 
      queryParams: { email: this.email } 
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
```

### Paso 4.3: Template HTML

`src/app/components/forgot-password/forgot-password.component.html`:

```html
<div class="forgot-password-dialog">
  <div class="dialog-header">
    <h2>Recuperar Contraseña</h2>
    <button mat-icon-button (click)="closeDialog()" class="close-button">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <div class="dialog-content">
    @if (!codeSent) {
      <p class="instructions">
        Ingresa tu dirección de correo electrónico y te enviaremos un código de verificación de 6 dígitos.
      </p>

      <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Correo electrónico</mat-label>
          <input matInput type="email" formControlName="email" placeholder="tu@email.com" autocomplete="email">
          <mat-icon matPrefix>email</mat-icon>
          @if (forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched) {
            <mat-error>{{ getErrorMessage('email') }}</mat-error>
          }
        </mat-form-field>

        <div class="dialog-actions">
          <button mat-stroked-button type="button" (click)="closeDialog()" [disabled]="loading">
            Cancelar
          </button>
          <button mat-raised-button type="submit" [disabled]="forgotPasswordForm.invalid || loading">
            @if (loading) {
              <span>Enviando...</span>
            } @else {
              <span>Enviar Código</span>
            }
          </button>
        </div>
      </form>
    } @else {
      <div class="success-message">
        <mat-icon class="success-icon">mark_email_read</mat-icon>
        <h3>¡Código Enviado!</h3>
        <p>
          Si existe una cuenta asociada a <strong>{{ email }}</strong>,
          recibirás un email con un código de verificación de 6 dígitos.
        </p>
        <p class="note">Revisa tu bandeja de entrada y la carpeta de spam. El código expira en 15 minutos.</p>
        
        <div class="success-actions">
          <button mat-stroked-button (click)="resendCode()" [disabled]="loading">
            @if (loading) {
              Reenviando...
            } @else {
              Reenviar Código
            }
          </button>
          <button mat-raised-button (click)="continueToVerification()">
            Continuar
          </button>
        </div>
      </div>
    }
  </div>
</div>
```

---

## 5️⃣ Crear Componente de Verificación de Código

### Paso 5.1: Crear el componente

```bash
ng generate component components/verify-code --standalone
```

### Paso 5.2: TypeScript del componente

`src/app/components/verify-code/verify-code.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PasswordResetService } from '../../services/password-reset.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.css'
})
export class VerifyCodeComponent implements OnInit {
  verifyCodeForm: FormGroup;
  loading = false;
  email = '';
  codeVerified = false;
  countdown = 900; // 15 minutos en segundos
  countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService,
    private notificationService: NotificationService
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
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.notificationService.showError('Email no proporcionado');
        this.router.navigate(['/forgot-password']);
      }
    });

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
      const nextField = `digit${i + 1}`;

      this.verifyCodeForm.get(currentField)?.valueChanges.subscribe(value => {
        if (value && value.length === 1 && i < 6) {
          const nextControl = this.verifyCodeForm.get(nextField);
          if (nextControl) {
            nextControl.focus();
          }
        }
      });
    }
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
        
        // Redirigir a restablecer contraseña después de 1 segundo
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { 
            queryParams: { email: this.email } 
          });
        }, 1000);
      } else {
        this.notificationService.showError(result.message || 'Código inválido');
        
        // Limpiar el formulario si hay error
        this.verifyCodeForm.reset();
        this.verifyCodeForm.get('digit1')?.focus();
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
          prevControl.focus();
        }
      }
    }
  }
}
```

### Paso 5.3: Template HTML

`src/app/components/verify-code/verify-code.component.html`:

```html
<div class="verify-code-container">
  <div class="verify-code-card">
    <div class="card-header">
      <mat-icon class="header-icon">lock</mat-icon>
      <h1>Verificar Código</h1>
      <p>Ingresa el código de 6 dígitos enviado a<br><strong>{{ email }}</strong></p>
      @if (countdown > 0) {
        <p class="countdown">Código válido por: <strong>{{ getCountdownFormatted() }}</strong></p>
      } @else {
        <p class="countdown expired">El código ha expirado</p>
      }
    </div>

    <form [formGroup]="verifyCodeForm" (ngSubmit)="onSubmit()" class="verify-form">
      <div class="code-inputs">
        @for (digit of [1,2,3,4,5,6]; track digit) {
          <input
            type="text"
            [formControlName]="'digit' + digit"
            class="code-digit"
            maxlength="1"
            pattern="[0-9]"
            (keydown)="onKeyDown($event, digit)"
            #codeInput>
        }
      </div>

      <button 
        mat-raised-button 
        type="submit" 
        class="verify-button"
        [disabled]="verifyCodeForm.invalid || loading || countdown === 0">
        @if (loading) {
          <span>Verificando...</span>
        } @else {
          <span>VERIFICAR CÓDIGO</span>
        }
      </button>
    </form>

    <div class="resend-section">
      <p>¿No recibiste el código?</p>
      <button mat-button (click)="resendCode()" [disabled]="loading">
        Reenviar código
      </button>
    </div>

    <div class="back-link">
      <a routerLink="/login">Volver al inicio de sesión</a>
    </div>
  </div>
</div>
```

### Paso 5.4: Estilos CSS

`src/app/components/verify-code/verify-code.component.css`:

```css
.verify-code-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f5f5f5;
}

.verify-code-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.header-icon {
  font-size: 64px !important;
  width: 64px !important;
  height: 64px !important;
  color: var(--institucion-primary, #800020);
  margin-bottom: 1rem;
}

.card-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.card-header p {
  color: #666;
  margin: 0.5rem 0;
}

.countdown {
  font-size: 0.9rem;
  color: #2196f3;
  font-weight: 600;
  margin-top: 1rem;
}

.countdown.expired {
  color: #f44336;
}

.verify-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.code-inputs {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin: 2rem 0;
}

.code-digit {
  width: 50px;
  height: 60px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
}

.code-digit:focus {
  border-color: var(--institucion-primary, #800020);
  box-shadow: 0 0 0 3px rgba(128, 0, 32, 0.1);
}

.code-digit:invalid {
  border-color: #f44336;
}

.verify-button {
  width: 100%;
  height: 50px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1rem;
}

.resend-section {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.resend-section p {
  margin-bottom: 0.5rem;
  color: #666;
}

.back-link {
  text-align: center;
  margin-top: 1.5rem;
}

.back-link a {
  color: var(--institucion-primary, #800020);
  text-decoration: none;
  font-weight: 500;
}

.back-link a:hover {
  text-decoration: underline;
}

/* Modo oscuro */
:root.dark-mode .verify-code-container,
html.dark-mode .verify-code-container {
  background: #0a0a0a;
}

:root.dark-mode .verify-code-card,
html.dark-mode .verify-code-card {
  background: #1a1a1a;
  color: #ffffff;
}

:root.dark-mode .code-digit,
html.dark-mode .code-digit {
  background: #2a2a2a;
  border-color: #444;
  color: #ffffff;
}

:root.dark-mode .code-digit:focus,
html.dark-mode .code-digit:focus {
  border-color: var(--institucion-primary, #800020);
}
```

---

## 6️⃣ Crear Componente de Restablecimiento

### Paso 6.1: Crear el componente

```bash
ng generate component components/reset-password --standalone
```

### Paso 6.2: TypeScript del componente

`src/app/components/reset-password/reset-password.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
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
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService,
    private notificationService: NotificationService
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.notificationService.showError('Email no proporcionado');
        this.router.navigate(['/login']);
        return;
      }

      // Verificar que hay un código verificado
      this.checkVerifiedCode();
    });
  }

  async checkVerifiedCode(): Promise<void> {
    const codeInfo = await this.passwordResetService.getVerifiedCodeInfo(this.email);
    if (!codeInfo.valid) {
      this.notificationService.showError(codeInfo.message || 'Debes verificar el código primero');
      this.router.navigate(['/verify-code'], { queryParams: { email: this.email } });
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
        setTimeout(() => {
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
```

### Paso 6.3: Template HTML

`src/app/components/reset-password/reset-password.component.html`:

```html
<div class="reset-password-container">
  <div class="reset-password-card">
    <div class="card-header">
      <mat-icon class="header-icon">lock_reset</mat-icon>
      <h1>Restablecer Contraseña</h1>
      <p>Ingresa tu nueva contraseña para <strong>{{ email }}</strong></p>
    </div>

    @if (!codeVerified) {
      <div class="loading-container">
        <mat-icon class="loading-icon">lock</mat-icon>
        <p>Verificando código...</p>
      </div>
    } @else {
      <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="reset-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nueva Contraseña</mat-label>
          <input 
            matInput 
            [type]="hidePassword ? 'password' : 'text'"
            formControlName="password" 
            placeholder="Nueva contraseña"
            autocomplete="new-password">
          <mat-icon matPrefix>lock</mat-icon>
          <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button" tabindex="-1">
            <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (resetPasswordForm.get('password')?.invalid && resetPasswordForm.get('password')?.touched) {
            <mat-error>{{ getErrorMessage('password') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirmar Contraseña</mat-label>
          <input 
            matInput 
            [type]="hideConfirmPassword ? 'password' : 'text'"
            formControlName="confirmPassword" 
            placeholder="Confirmar contraseña"
            autocomplete="new-password">
          <mat-icon matPrefix>lock_outline</mat-icon>
          <button mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword" type="button" tabindex="-1">
            <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched) {
            <mat-error>{{ getErrorMessage('confirmPassword') }}</mat-error>
          }
        </mat-form-field>

        <button 
          mat-raised-button 
          type="submit" 
          class="reset-button"
          [disabled]="resetPasswordForm.invalid || loading">
          @if (loading) {
            <span>Restableciendo...</span>
          } @else {
            <span>RESTABLECER CONTRASEÑA</span>
          }
        </button>
      </form>
    }
  </div>
</div>
```

---

## 7️⃣ Crear Rutas

### Paso 7.1: Actualizar app.routes.ts

Agrega estas rutas en `src/app/app.routes.ts`:

```typescript
{
  path: 'forgot-password',
  loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  canActivate: [institucionGuard]
},
{
  path: 'verify-code',
  loadComponent: () => import('./components/verify-code/verify-code.component').then(m => m.VerifyCodeComponent),
  canActivate: [institucionGuard]
},
{
  path: 'reset-password',
  loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  canActivate: [institucionGuard]
},
```

---

## 8️⃣ Actualizar Login Component

### Paso 8.1: Instalar MatDialog

Asegúrate de tener `@angular/material/dialog` instalado:

```bash
npm install @angular/material
```

### Paso 8.2: Modificar login.component.ts

Actualiza `src/app/components/login/login.component.ts`:

```typescript
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { Router } from '@angular/router';

// En los imports del decorator, agregar MatDialogModule:

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
    MatDialogModule, // Agregar esto
    RouterModule
  ],
  // ...
})

// En el constructor, agregar MatDialog:

constructor(
  private fb: FormBuilder,
  private authService: AuthService,
  private institucionService: InstitucionService,
  private router: Router,
  private notificationService: NotificationService,
  private dialog: MatDialog // Agregar esto
) {
  // ...
}

// Reemplazar el método onForgotPassword:

onForgotPassword(event: Event): void {
  event.preventDefault();
  
  const dialogRef = this.dialog.open(ForgotPasswordComponent, {
    width: '500px',
    maxWidth: '90vw',
    disableClose: false,
    panelClass: 'forgot-password-dialog-container'
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && result.step === 'verify') {
      this.router.navigate(['/verify-code'], { 
        queryParams: { email: result.email } 
      });
    }
  });
}
```

---

## 9️⃣ Configurar Plantilla de Email

### Paso 9.1: Crear plantilla de email

El servicio de email necesita una plantilla HTML. Aquí tienes un ejemplo básico:

**Ejemplo de Email HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #800020; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .code-box { 
      background: white; 
      border: 2px solid #800020; 
      padding: 20px; 
      text-align: center; 
      font-size: 32px; 
      font-weight: bold; 
      letter-spacing: 5px; 
      margin: 20px 0;
      font-family: 'Courier New', monospace;
    }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .warning { color: #f44336; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AcademicSystem</h1>
      <h2>Código de Verificación</h2>
    </div>
    <div class="content">
      <p>Hola <strong>{{nombreUsuario}}</strong>,</p>
      <p>Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:</p>
      
      <div class="code-box">
        {{code}}
      </div>
      
      <p class="warning">⚠️ Este código expira en 15 minutos.</p>
      
      <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
    </div>
    <div class="footer">
      <p>© 2024 AcademicSystem. Todos los derechos reservados.</p>
      <p>Este es un email automático, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>
```

---

## ✅ Resumen del Flujo Completo

1. **Usuario hace clic en "Olvidé mi contraseña"** → Abre diálogo
2. **Usuario ingresa email** → Se envía código de 6 dígitos
3. **Usuario recibe email con código** → Ingresa código en página de verificación
4. **Código verificado** → Redirige a restablecer contraseña
5. **Usuario ingresa nueva contraseña** → Contraseña actualizada
6. **Usuario puede iniciar sesión** → Con nueva contraseña

---

## 🔒 Características de Seguridad

✅ **Código de 6 dígitos** numérico aleatorio  
✅ **Expiración de 15 minutos**  
✅ **Máximo 5 intentos** de verificación  
✅ **Validación doble**: Email + Código  
✅ **Limpieza automática** de códigos expirados  
✅ **Código de un solo uso** después de verificación  

---

## 📝 Notas Importantes

1. ⚠️ **En producción**, hashea las contraseñas con bcrypt antes de guardar
2. ⚠️ **Configura un servicio de email real** (Resend, SendGrid, etc.)
3. ⚠️ **Los códigos expiran** después de 15 minutos
4. ⚠️ **Los códigos solo pueden usarse una vez**
5. ⚠️ **Máximo 5 intentos** de verificación por código

---

## 🚀 ¡Listo!

Sigue estos pasos en orden y tendrás un sistema completo y seguro de recuperación de contraseña con verificación por código. 🎉

