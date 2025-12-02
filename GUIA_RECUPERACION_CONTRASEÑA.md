# 🔐 Guía Completa: Sistema de Recuperación de Contraseña

## 📋 Índice de Pasos

1. [Configurar Base de Datos](#1-configurar-base-de-datos)
2. [Crear Servicio de Email](#2-crear-servicio-de-email)
3. [Crear Servicio de Recuperación](#3-crear-servicio-de-recuperación)
4. [Crear Componente de Solicitud](#4-crear-componente-de-solicitud)
5. [Crear Componente de Restablecimiento](#5-crear-componente-de-restablecimiento)
6. [Crear Rutas](#6-crear-rutas)
7. [Actualizar Login Component](#7-actualizar-login-component)
8. [Configurar Plantilla de Email](#8-configurar-plantilla-de-email)
9. [Probar el Sistema](#9-probar-el-sistema)

---

## 1️⃣ Configurar Base de Datos

### Paso 1.1: Crear tabla para tokens de recuperación

Ve a Supabase SQL Editor y ejecuta este script:

```sql
-- Tabla para almacenar tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT token_unique UNIQUE (token)
);

-- Índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- Función para limpiar tokens expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE password_reset_tokens IS 'Almacena tokens temporales para recuperación de contraseña';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único para el enlace de recuperación';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Fecha de expiración del token (típicamente 1 hora)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Indica si el token ya fue usado';
```

---

## 2️⃣ Crear Servicio de Email

### Paso 2.1: Instalar dependencias (si usas un servicio externo)

Si decides usar un servicio como Resend, SendGrid, o similar:

```bash
npm install resend
# O
npm install @sendgrid/mail
```

**Opción recomendada:** Usar Supabase Edge Functions con Resend (gratis hasta 100 emails/día)

### Paso 2.2: Crear servicio de email básico

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
   * Envía un email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email: string, resetLink: string, nombreUsuario: string): Promise<boolean> {
    try {
      // Opción 1: Usar Supabase Edge Function (recomendado)
      const { data, error } = await this.supabase.client.functions.invoke('send-password-reset', {
        body: {
          email,
          resetLink,
          nombreUsuario
        }
      });

      if (error) {
        console.error('Error enviando email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en servicio de email:', error);
      return false;
    }
  }

  /**
   * Método alternativo usando un servicio externo (Resend, SendGrid, etc.)
   */
  async sendPasswordResetEmailExternal(
    email: string, 
    resetLink: string, 
    nombreUsuario: string
  ): Promise<boolean> {
    // Implementar aquí la lógica con tu servicio de email preferido
    // Por ahora retornamos true para desarrollo
    console.log(`Email de recuperación enviado a: ${email}`);
    console.log(`Link: ${resetLink}`);
    return true;
  }
}
```

---

## 3️⃣ Crear Servicio de Recuperación

### Paso 3.1: Crear el servicio

Crea `src/app/services/password-reset.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EmailService } from './email.service';
import { environment } from '../../environments/environment';
import { v4 as uuidv4 } from 'uuid';

interface PasswordResetToken {
  id: string;
  usuario_id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private readonly TOKEN_EXPIRY_HOURS = 1; // Token válido por 1 hora

  constructor(
    private supabase: SupabaseService,
    private emailService: EmailService
  ) {}

  /**
   * Genera un token único para recuperación de contraseña
   */
  private generateToken(): string {
    return uuidv4() + '-' + Date.now().toString(36);
  }

  /**
   * Solicita un reset de contraseña
   * Envía un email con el enlace de recuperación
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Buscar usuario por email
      const { data: usuario, error: userError } = await this.supabase.client
        .from('usuarios')
        .select('id, email, nombre, username')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !usuario) {
        // Por seguridad, no revelamos si el email existe o no
        return {
          success: true, // Retornamos success para no revelar información
          message: 'Si el email existe, recibirás un enlace de recuperación'
        };
      }

      // 2. Invalidar tokens previos del usuario
      await this.supabase.client
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('usuario_id', usuario.id)
        .eq('used', false);

      // 3. Generar nuevo token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // 4. Guardar token en la base de datos
      const { error: tokenError } = await this.supabase.client
        .from('password_reset_tokens')
        .insert({
          usuario_id: usuario.id,
          email: usuario.email,
          token: token,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (tokenError) {
        console.error('Error guardando token:', tokenError);
        return {
          success: false,
          message: 'Error al generar token de recuperación'
        };
      }

      // 5. Generar enlace de recuperación
      const resetLink = `${environment.appUrl || window.location.origin}/reset-password?token=${token}`;

      // 6. Enviar email
      const emailSent = await this.emailService.sendPasswordResetEmail(
        usuario.email,
        resetLink,
        usuario.nombre || usuario.username
      );

      if (!emailSent) {
        return {
          success: false,
          message: 'Error al enviar el email de recuperación'
        };
      }

      return {
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación'
      };

    } catch (error) {
      console.error('Error en requestPasswordReset:', error);
      return {
        success: false,
        message: 'Error inesperado al procesar la solicitud'
      };
    }
  }

  /**
   * Valida un token de recuperación
   */
  async validateToken(token: string): Promise<{ valid: boolean; email?: string; usuarioId?: string; message?: string }> {
    try {
      const { data, error } = await this.supabase.client
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (error || !data) {
        return {
          valid: false,
          message: 'Token inválido o no encontrado'
        };
      }

      // Verificar si el token expiró
      const expiresAt = new Date(data.expires_at);
      const now = new Date();

      if (expiresAt < now) {
        return {
          valid: false,
          message: 'El token ha expirado. Por favor solicita uno nuevo.'
        };
      }

      return {
        valid: true,
        email: data.email,
        usuarioId: data.usuario_id
      };

    } catch (error) {
      console.error('Error validando token:', error);
      return {
        valid: false,
        message: 'Error al validar el token'
      };
    }
  }

  /**
   * Restablece la contraseña con un token válido
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validar token
      const validation = await this.validateToken(token);
      if (!validation.valid || !validation.usuarioId) {
        return {
          success: false,
          message: validation.message || 'Token inválido'
        };
      }

      // 2. Actualizar contraseña del usuario
      const { error: updateError } = await this.supabase.client
        .from('usuarios')
        .update({ password: newPassword }) // En producción, hashearlo primero
        .eq('id', validation.usuarioId);

      if (updateError) {
        console.error('Error actualizando contraseña:', updateError);
        return {
          success: false,
          message: 'Error al actualizar la contraseña'
        };
      }

      // 3. Marcar token como usado
      await this.supabase.client
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token);

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
   * Limpia tokens expirados (llamar periódicamente)
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await this.supabase.client.rpc('cleanup_expired_tokens');
    } catch (error) {
      console.error('Error limpiando tokens:', error);
    }
  }
}
```

### Paso 3.2: Instalar UUID

```bash
npm install uuid
npm install --save-dev @types/uuid
```

---

## 4️⃣ Crear Componente de Solicitud

### Paso 4.1: Crear el componente

Crea el componente para solicitar el reset:

```bash
ng generate component components/forgot-password --standalone
```

### Paso 4.2: Actualizar el componente TypeScript

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
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<ForgotPasswordComponent>
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
    const email = this.forgotPasswordForm.get('email')?.value;

    this.passwordResetService.requestPasswordReset(email).then(result => {
      this.loading = false;
      
      if (result.success) {
        this.emailSent = true;
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

### Paso 4.3: Crear el template HTML

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
    @if (!emailSent) {
      <p class="instructions">
        Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
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
              <span>Enviar Enlace</span>
            }
          </button>
        </div>
      </form>
    } @else {
      <div class="success-message">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h3>¡Email Enviado!</h3>
        <p>
          Si existe una cuenta asociada a <strong>{{ forgotPasswordForm.get('email')?.value }}</strong>,
          recibirás un email con las instrucciones para restablecer tu contraseña.
        </p>
        <p class="note">Revisa tu bandeja de entrada y la carpeta de spam.</p>
        <button mat-raised-button (click)="closeDialog()" class="close-button">
          Cerrar
        </button>
      </div>
    }
  </div>
</div>
```

### Paso 4.4: Crear estilos CSS

`src/app/components/forgot-password/forgot-password.component.css`:

```css
.forgot-password-dialog {
  width: 100%;
  max-width: 500px;
  padding: 0;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-button {
  margin-left: auto;
}

.dialog-content {
  padding: 1.5rem;
}

.instructions {
  margin-bottom: 1.5rem;
  color: #666;
  line-height: 1.6;
}

.full-width {
  width: 100%;
  margin-bottom: 1rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.success-message {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  font-size: 64px !important;
  width: 64px !important;
  height: 64px !important;
  color: #4caf50;
  margin-bottom: 1rem;
}

.success-message h3 {
  margin: 1rem 0;
  color: #4caf50;
}

.success-message p {
  margin: 1rem 0;
  color: #666;
  line-height: 1.6;
}

.note {
  font-size: 0.9rem;
  font-style: italic;
  color: #999;
}

/* Modo oscuro */
:root.dark-mode .dialog-header,
html.dark-mode .dialog-header {
  border-bottom-color: #444;
}

:root.dark-mode .instructions,
html.dark-mode .instructions {
  color: #b0b0b0;
}

:root.dark-mode .success-message p,
html.dark-mode .success-message p {
  color: #b0b0b0;
}
```

---

## 5️⃣ Crear Componente de Restablecimiento

### Paso 5.1: Crear el componente

```bash
ng generate component components/reset-password --standalone
```

### Paso 5.2: Actualizar TypeScript

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
  validating = true;
  tokenValid = false;
  token = '';
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
    // Obtener token de la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.validating = false;
        this.tokenValid = false;
        this.notificationService.showError('Token no proporcionado');
      }
    });
  }

  validateToken(): void {
    this.passwordResetService.validateToken(this.token).then(result => {
      this.validating = false;
      this.tokenValid = result.valid;
      
      if (!result.valid) {
        this.notificationService.showError(result.message || 'Token inválido');
      }
    }).catch(error => {
      this.validating = false;
      this.tokenValid = false;
      this.notificationService.showError('Error al validar el token');
      console.error('Error:', error);
    });
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

    this.loading = true;
    const newPassword = this.resetPasswordForm.get('password')?.value;

    this.passwordResetService.resetPassword(this.token, newPassword).then(result => {
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

### Paso 5.3: Crear template HTML

`src/app/components/reset-password/reset-password.component.html`:

```html
<div class="reset-password-container">
  <div class="reset-password-card">
    <div class="card-header">
      <h1>Restablecer Contraseña</h1>
      <p>Ingresa tu nueva contraseña</p>
    </div>

    @if (validating) {
      <div class="loading-container">
        <mat-icon class="loading-icon">lock</mat-icon>
        <p>Validando token...</p>
      </div>
    } @else if (!tokenValid) {
      <div class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h2>Token Inválido o Expirado</h2>
        <p>El enlace de recuperación no es válido o ha expirado.</p>
        <a routerLink="/forgot-password" mat-raised-button>
          Solicitar Nuevo Enlace
        </a>
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

### Paso 5.4: Crear estilos CSS

`src/app/components/reset-password/reset-password.component.css`:

```css
.reset-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f5f5f5;
}

.reset-password-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.card-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.card-header p {
  color: #666;
  margin: 0;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 2rem 0;
}

.loading-icon,
.error-icon {
  font-size: 64px !important;
  width: 64px !important;
  height: 64px !important;
  margin-bottom: 1rem;
}

.loading-icon {
  color: #2196f3;
  animation: pulse 2s infinite;
}

.error-icon {
  color: #f44336;
}

.error-container h2 {
  margin: 1rem 0;
  color: #f44336;
}

.error-container p {
  color: #666;
  margin-bottom: 1.5rem;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.full-width {
  width: 100%;
}

.reset-button {
  width: 100%;
  height: 50px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Modo oscuro */
:root.dark-mode .reset-password-container,
html.dark-mode .reset-password-container {
  background: #0a0a0a;
}

:root.dark-mode .reset-password-card,
html.dark-mode .reset-password-card {
  background: #1a1a1a;
  color: #ffffff;
}

:root.dark-mode .card-header h1,
html.dark-mode .card-header h1 {
  color: #ffffff;
}

:root.dark-mode .card-header p,
html.dark-mode .card-header p {
  color: #b0b0b0;
}
```

---

## 6️⃣ Crear Rutas

### Paso 6.1: Actualizar app.routes.ts

Agrega las rutas:

```typescript
{
  path: 'reset-password',
  loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
},
{
  path: 'forgot-password',
  loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
},
```

---

## 7️⃣ Actualizar Login Component

### Paso 7.1: Modificar el método onForgotPassword

Actualiza `src/app/components/login/login.component.ts`:

```typescript
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';

// En el constructor, agregar:
constructor(
  // ... otros servicios
  private dialog: MatDialog
) { }

// Reemplazar el método onForgotPassword:
onForgotPassword(event: Event): void {
  event.preventDefault();
  this.dialog.open(ForgotPasswordComponent, {
    width: '500px',
    maxWidth: '90vw',
    disableClose: false
  });
}
```

### Paso 7.2: Agregar import de MatDialogModule

En los imports del componente:

```typescript
imports: [
  // ... otros imports
  MatDialogModule
]
```

---

## 8️⃣ Configurar Plantilla de Email

### Opción A: Usando Supabase Edge Function (Recomendado)

Crea una Edge Function en Supabase para enviar emails.

### Opción B: Configurar URL de la aplicación

Agrega a `src/environments/environment.ts`:

```typescript
export const environment = {
  // ... otras configuraciones
  appUrl: 'http://localhost:4200', // Cambiar en producción
  // ...
};
```

---

## 9️⃣ Probar el Sistema

### Pasos de prueba:

1. ✅ Ir a la página de login
2. ✅ Hacer clic en "Olvidé mi contraseña"
3. ✅ Ingresar un email válido
4. ✅ Verificar que se muestre el mensaje de éxito
5. ✅ Buscar el email en la bandeja de entrada
6. ✅ Hacer clic en el enlace del email
7. ✅ Ingresar nueva contraseña
8. ✅ Verificar que se pueda iniciar sesión con la nueva contraseña

---

## 🔧 Configuraciones Adicionales

### Hash de contraseñas

**IMPORTANTE:** En producción, debes hashear las contraseñas antes de guardarlas. Instala bcrypt:

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Y actualiza el servicio de reset para hashear:

```typescript
import * as bcrypt from 'bcryptjs';

// Antes de guardar:
const hashedPassword = await bcrypt.hash(newPassword, 10);
```

---

## 📝 Notas Importantes

1. ⚠️ **Seguridad**: Siempre hashea las contraseñas antes de guardarlas
2. ⚠️ **Tokens**: Los tokens expiran después de 1 hora
3. ⚠️ **Emails**: Configura un servicio de email real para producción
4. ⚠️ **Validación**: Los tokens solo pueden usarse una vez
5. ⚠️ **URLs**: Configura correctamente las URLs de la aplicación

---

## 🆘 Troubleshooting

### El email no llega
- Verifica la configuración del servicio de email
- Revisa la carpeta de spam
- Verifica los logs del servidor

### Token inválido
- Verifica que el token no haya expirado
- Asegúrate de copiar el token completo de la URL
- Verifica que el token no haya sido usado antes

### Error de base de datos
- Verifica que la tabla `password_reset_tokens` existe
- Revisa los permisos de la base de datos
- Verifica las foreign keys

---

¡Listo! Sigue estos pasos en orden y tendrás un sistema completo de recuperación de contraseña funcionando. 🎉



