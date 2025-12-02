import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EmailService } from './email.service';

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
        console.warn('⚠️ Usuario no encontrado para email:', email);
        console.warn('💡 Verifica que el email exista en la tabla usuarios');
        return {
          success: false,
          message: 'No existe un usuario registrado con ese email. Verifica que el email sea correcto.',
          canResend: false
        };
      }

      console.log('✅ Usuario encontrado:', usuario.email, usuario.nombre || usuario.username);

      // 2. Invalidar códigos previos no usados del usuario
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

      console.log('📧 Enviando código de verificación:', code);
      console.log('📬 A email:', usuario.email);

      // 5. Enviar email con el código
      const emailSent = await this.emailService.sendVerificationCode(
        usuario.email,
        code,
        usuario.nombre || usuario.username
      );

      if (!emailSent) {
        console.error('❌ Falló el envío del email. El código está guardado en la BD.');
        console.log('💡 Revisa la consola (F12) para ver el código (modo fallback)');
        console.log('================================');
        console.log('📧 CÓDIGO DE VERIFICACIÓN (FALLBACK)');
        console.log('================================');
        console.log(`Email: ${usuario.email}`);
        console.log(`Código: ${code}`);
        console.log(`Usuario: ${usuario.nombre || usuario.username}`);
        console.log('================================');
        return {
          success: false, // Cambiar a false para indicar que no se envió
          message: 'Error al enviar el código de verificación. Por favor, verifica tu conexión a internet y las credenciales de EmailJS. Revisa la consola del navegador (F12) para más detalles.',
          canResend: true
        };
      }

      console.log('✅ Código enviado exitosamente');

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

      // 4. Obtener información del usuario para email con nueva contraseña
      const { data: usuario } = await this.supabase.client
        .from('usuarios')
        .select('nombre, username, email')
        .eq('id', codeInfo.usuarioId)
        .single();

      // 5. Enviar email con la nueva contraseña, usuario y email
      if (usuario) {
        await this.emailService.sendNewPassword(
          email,
          newPassword,
          usuario.nombre || usuario.username,
          usuario.username || email,
          usuario.email || email
        );
      }

      return {
        success: true,
        message: 'Contraseña restablecida exitosamente. Se ha enviado un email con tu nueva contraseña.'
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

