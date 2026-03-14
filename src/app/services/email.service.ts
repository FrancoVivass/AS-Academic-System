import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  constructor(private supabase: SupabaseService) {
    // Inicializar EmailJS con la clave pública
    if (environment.emailjs?.publicKey) {
      emailjs.init(environment.emailjs.publicKey);
    }
  }

  /**
   * Envía un email con código de verificación usando EmailJS
   */
  async sendVerificationCode(
    email: string, 
    code: string, 
    nombreUsuario: string
  ): Promise<boolean> {
    try {
      // Intentar usar Supabase Edge Function primero (si existe)
      try {
        const { data, error } = await this.supabase.client.functions.invoke('send-verification-code', {
          body: {
            email,
            code,
            nombreUsuario
          }
        });

        if (!error && data) {
          console.log('✅ Email enviado exitosamente mediante Edge Function');
          return true;
        }
      } catch (edgeError) {
        console.log('Edge Function no disponible, usando EmailJS directamente');
      }

      // Usar EmailJS
      if (environment.emailjs?.serviceId && environment.emailjs?.templateId && environment.emailjs?.publicKey) {
        console.log('✅ EmailJS está configurado, intentando enviar...');
        const result = await this.sendWithEmailJS(email, code, nombreUsuario, 'verification');
        if (result) {
          console.log('✅ Email enviado exitosamente con EmailJS');
          return true; // Email enviado exitosamente
        }
        // Si falla, continuar al fallback
        console.error('❌ EmailJS falló al enviar el email');
      } else {
        console.error('❌ EmailJS no está completamente configurado:');
        console.error('  - Service ID:', environment.emailjs?.serviceId || 'FALTA');
        console.error('  - Template ID:', environment.emailjs?.templateId || 'FALTA');
        console.error('  - Public Key:', environment.emailjs?.publicKey ? 'Configurada' : 'FALTA');
        console.error('💡 Verifica environment.ts y asegúrate de que todas las credenciales estén configuradas');
      }

      // Fallback: mostrar en consola (solo para desarrollo)
      console.warn('⚠️ Usando modo fallback - código en consola');
      return this.sendVerificationCodeFallback(email, code, nombreUsuario);
    } catch (error) {
      console.error('Error en servicio de email:', error);
      return this.sendVerificationCodeFallback(email, code, nombreUsuario);
    }
  }

  /**
   * Envía email usando EmailJS
   */
  private async sendWithEmailJS(
    email: string,
    code: string,
    nombreUsuario: string,
    type: 'verification' | 'password-changed' | 'new-password',
    username?: string,
    userEmail?: string
  ): Promise<boolean> {
    try {
      // Verificar que EmailJS esté inicializado
      if (!environment.emailjs?.publicKey) {
        console.error('❌ EmailJS Public Key no configurada');
        return false;
      }

      // Verificar que las credenciales estén completas
      if (!environment.emailjs?.serviceId || !environment.emailjs?.templateId) {
        console.error('❌ EmailJS Service ID o Template ID no configurados');
        console.error('Service ID:', environment.emailjs?.serviceId);
        console.error('Template ID:', environment.emailjs?.templateId);
        return false;
      }

      // Parámetros del template - SOLO enviar las variables que realmente se usan
      // EmailJS marca como corruptas las variables que no están en el template
      let templateParams: any = {};

      if (type === 'new-password') {
        // Para template de nueva contraseña - SOLO estas variables
        templateParams = {
          to_name: String(nombreUsuario || 'Usuario'),
          to_email: String(email || ''),
          password: String(code || ''),
          username: String(username || email || ''),
          user_email: String(userEmail || email || ''),
          code: String(code || '') // Por compatibilidad
        };
      } else if (type === 'verification') {
        // Para template de código de verificación
        // EmailJS "To Email" puede usar to_email, reply_to, user_email o email - enviamos todos
        const recipientEmail = String(email || '');
        templateParams = {
          to_name: String(nombreUsuario || 'Usuario'),
          to_email: recipientEmail,
          reply_to: recipientEmail,
          user_email: recipientEmail,
          email: recipientEmail,
          code: String(code || '')
        };
      } else {
        // Para otros tipos
        templateParams = {
          to_name: String(nombreUsuario || 'Usuario'),
          to_email: String(email || ''),
          code: String(code || '')
        };
      }

      const serviceId = environment.emailjs.serviceId;
      const templateId = type === 'verification' 
        ? environment.emailjs.templateId 
        : environment.emailjs.templateIdPassword || environment.emailjs.templateId;

      console.log('📤 Enviando email con EmailJS...');
      console.log('📧 Destinatario:', email);
      console.log('📨 Tipo:', type);
      console.log('🔑 Service ID:', serviceId);
      console.log('🔑 Template ID:', templateId);
      console.log('🔑 Public Key:', environment.emailjs.publicKey ? 'Configurada' : 'No configurada');
      console.log('📋 Template Params:', templateParams);

      // Asegurar que EmailJS esté inicializado
      if (!emailjs.init) {
        console.error('❌ EmailJS no está disponible. Verifica que @emailjs/browser esté instalado.');
        return false;
      }

      // Inicializar si no está inicializado
      try {
        emailjs.init(environment.emailjs.publicKey);
      } catch (initError) {
        console.warn('⚠️ EmailJS ya inicializado o error en init:', initError);
      }

      // Los parámetros ya están limpios y convertidos a string
      // Solo enviar exactamente lo que necesita el template
      console.log('📋 Template Params (finales):', templateParams);

      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams
      );

      console.log('📬 Respuesta de EmailJS:', response);

      if (response.status === 200) {
        console.log('✅ Email enviado exitosamente con EmailJS');
        console.log('📧 Email enviado a:', email);
        console.log('📨 Response text:', response.text);
        if (type === 'verification') {
          console.log('🔑 Código enviado:', code);
        }
        return true;
      } else {
        console.error('❌ Error enviando email con EmailJS. Status:', response.status);
        console.error('📋 Respuesta completa:', response);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error en EmailJS:', error);
      console.error('💡 Tipo de error:', error.name);
      console.error('💡 Mensaje:', error.message || error);
      console.error('💡 Stack:', error.stack);
      
      // Detalles específicos de EmailJS
      if (error.text) {
        console.error('💡 Error text:', error.text);
      }
      if (error.status) {
        console.error('💡 Error status:', error.status);
      }
      
      return false;
    }
  }

  /**
   * Envía email de confirmación de cambio de contraseña
   */
  async sendPasswordChangedConfirmation(
    email: string,
    nombreUsuario: string
  ): Promise<boolean> {
    try {
      // Intentar usar Supabase Edge Function primero
      try {
        const { data, error } = await this.supabase.client.functions.invoke('send-password-changed', {
          body: {
            email,
            nombreUsuario
          }
        });

        if (!error && data) {
          console.log('✅ Confirmación enviada mediante Edge Function');
          return true;
        }
      } catch (edgeError) {
        console.log('Edge Function no disponible');
      }

      // Usar EmailJS
      if (environment.emailjs?.serviceId && environment.emailjs?.templateId) {
        return await this.sendWithEmailJS(email, '', nombreUsuario, 'password-changed');
      }

      return this.sendPasswordChangedConfirmationFallback(email, nombreUsuario);
    } catch (error) {
      console.error('Error en confirmación:', error);
      return this.sendPasswordChangedConfirmationFallback(email, nombreUsuario);
    }
  }

  /**
   * Envía email con la nueva contraseña después de restablecerla
   */
  async sendNewPassword(
    email: string,
    newPassword: string,
    nombreUsuario: string,
    username: string,
    userEmail: string
  ): Promise<boolean> {
    try {
      // Intentar usar Supabase Edge Function primero
      try {
        const { data, error } = await this.supabase.client.functions.invoke('send-new-password', {
          body: {
            email,
            newPassword,
            nombreUsuario
          }
        });

        if (!error && data) {
          console.log('✅ Email con nueva contraseña enviado mediante Edge Function');
          return true;
        }
      } catch (edgeError) {
        console.log('Edge Function no disponible, usando EmailJS directamente');
      }

      // Usar EmailJS
      if (environment.emailjs?.serviceId && environment.emailjs?.templateId) {
        return await this.sendWithEmailJS(email, newPassword, nombreUsuario, 'new-password', username, userEmail);
      }

      return this.sendNewPasswordFallback(email, newPassword, nombreUsuario, username, userEmail);
    } catch (error) {
      console.error('Error enviando nueva contraseña:', error);
      const username = arguments[3] || email;
      const userEmail = arguments[4] || email;
      return this.sendNewPasswordFallback(email, newPassword, nombreUsuario, username, userEmail);
    }
  }

  /**
   * Método fallback para desarrollo/pruebas
   * Muestra el código en consola cuando EmailJS no está disponible
   */
  private async sendVerificationCodeFallback(
    email: string,
    code: string, 
    nombreUsuario: string
  ): Promise<boolean> {
    console.log('');
    console.log('========================================');
    console.log('📧 EMAIL DE VERIFICACIÓN (FALLBACK)');
    console.log('========================================');
    console.log(`📬 Para: ${email}`);
    console.log(`👤 Usuario: ${nombreUsuario}`);
    console.log(`🔑 Código: ${code}`);
    console.log('========================================');
    console.log('⚠️ EmailJS no configurado o error.');
    console.log('💡 Revisa la consola del navegador (F12) para ver el código.');
    console.log('========================================');
    console.log('');
    
    // NO mostrar alert - solo consola
    // El código se mostrará en consola para desarrollo
    return false; // Retornar false para indicar que no se envió
  }

  /**
   * Método fallback para confirmación
   */
  private async sendPasswordChangedConfirmationFallback(
    email: string,
    nombreUsuario: string
  ): Promise<boolean> {
    console.log('================================');
    console.log('📧 CONFIRMACIÓN DE CAMBIO');
    console.log('================================');
    console.log(`Para: ${email}`);
    console.log(`Usuario: ${nombreUsuario}`);
    console.log('Tu contraseña ha sido cambiada exitosamente.');
    console.log('================================');
    
        return true;
  }

  /**
   * Método fallback para enviar nueva contraseña
   */
  private async sendNewPasswordFallback(
    email: string,
    newPassword: string,
    nombreUsuario: string,
    username: string,
    userEmail: string
  ): Promise<boolean> {
    console.log('================================');
    console.log('📧 NUEVA CONTRASEÑA');
    console.log('================================');
    console.log(`Para: ${email}`);
    console.log(`Usuario: ${nombreUsuario}`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${userEmail}`);
    console.log(`Nueva Contraseña: ${newPassword}`);
    console.log('================================');
    console.log('⚠️ EmailJS no disponible. Mostrando en consola.');
    console.log('================================');
    
    return false;
  }

  /**
   * Obtiene el asunto del email según el tipo
   */
  private getSubject(type: 'verification' | 'password-changed' | 'new-password'): string {
    switch (type) {
      case 'verification':
        return 'Código de Verificación - AcademicSystem';
      case 'password-changed':
        return 'Contraseña Cambiada - AcademicSystem';
      case 'new-password':
        return 'Tu Nueva Contraseña - AcademicSystem';
      default:
        return 'AcademicSystem';
    }
  }

  /**
   * Obtiene el mensaje de texto plano del email
   */
  private getEmailMessage(
    type: 'verification' | 'password-changed' | 'new-password',
    code: string,
    nombreUsuario: string,
    username?: string,
    userEmail?: string
  ): string {
    switch (type) {
      case 'verification':
        return `Hola ${nombreUsuario},\n\nTu código de verificación es: ${code}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este cambio, puedes ignorar este email de forma segura.`;
      case 'password-changed':
        return `Hola ${nombreUsuario},\n\nTu contraseña ha sido cambiada exitosamente.\n\nAhora puedes iniciar sesión con tu nueva contraseña.\n\nSi no realizaste este cambio, contacta inmediatamente al administrador.`;
      case 'new-password':
        const userInfo = username ? `\n\nUsuario: ${username}` : '';
        const emailInfo = userEmail ? `\nEmail: ${userEmail}` : '';
        return `Hola ${nombreUsuario},${userInfo}${emailInfo}\n\nTu contraseña ha sido restablecida exitosamente.\n\nTu nueva contraseña es: ${code}\n\nPor favor, guarda esta información en un lugar seguro. Puedes cambiarla nuevamente desde tu perfil una vez que inicies sesión.`;
      default:
        return '';
    }
  }

  /**
   * Obtiene el contenido HTML del email
   */
  private getEmailHTML(
    type: 'verification' | 'password-changed' | 'new-password',
    code: string,
    nombreUsuario: string,
    username?: string,
    userEmail?: string
  ): string {
    switch (type) {
      case 'verification':
        return this.getVerificationEmailTemplate(code, nombreUsuario);
      case 'password-changed':
        return this.getPasswordChangedTemplate(nombreUsuario);
      case 'new-password':
        return this.getNewPasswordTemplate(code, nombreUsuario, username, userEmail);
      default:
        return '';
    }
  }

  /**
   * Plantilla HTML para el email de verificación
   */
  private getVerificationEmailTemplate(code: string, nombreUsuario: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Código de Verificación - AcademicSystem</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333333; 
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-color: #f5f7fa;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .email-wrapper {
            padding: 40px 20px;
            min-height: 100vh;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #2b7bcc 0%, #1565c0 100%);
            color: white; 
            padding: 40px 30px;
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          .logo-container {
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }
          .logo-placeholder {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            backdrop-filter: blur(10px);
            border: 3px solid rgba(255, 255, 255, 0.3);
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 400;
            opacity: 0.95;
            position: relative;
            z-index: 1;
          }
          .content { 
            padding: 50px 40px;
            background: #ffffff; 
          }
          .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 25px;
            font-weight: 500;
          }
          .greeting strong {
            color: #2b7bcc;
            font-weight: 600;
          }
          .message {
            font-size: 16px;
            color: #555555;
            margin-bottom: 35px;
            line-height: 1.8;
          }
          .code-container {
            margin: 40px 0;
            text-align: center;
          }
          .code-label {
            font-size: 14px;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .code-box { 
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border: 3px solid #2b7bcc;
            border-radius: 12px;
            padding: 30px 25px;
            text-align: center; 
            font-size: 42px;
            font-weight: 700;
            letter-spacing: 12px;
            margin: 0 auto;
            font-family: 'Courier New', 'Monaco', monospace;
            color: #1565c0;
            box-shadow: 0 4px 15px rgba(43, 123, 204, 0.2);
            display: inline-block;
            min-width: 280px;
            position: relative;
            overflow: hidden;
          }
          .code-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shine 3s infinite;
          }
          @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          .warning-box { 
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            border-left: 4px solid #ff9800;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .warning-icon {
            font-size: 24px;
            flex-shrink: 0;
          }
          .warning-content {
            flex: 1;
          }
          .warning-title {
            color: #e65100;
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .warning-text {
            color: #bf360c;
            font-size: 14px;
            line-height: 1.6;
          }
          .info-box {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-left: 4px solid #2196f3;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .info-icon {
            font-size: 24px;
            flex-shrink: 0;
          }
          .info-content {
            flex: 1;
          }
          .info-title {
            color: #1565c0;
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .info-text {
            color: #0d47a1;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer { 
            text-align: center; 
            padding: 40px 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-top: 1px solid #dee2e6;
          }
          .footer-logo {
            font-size: 20px;
            font-weight: 700;
            color: #2b7bcc;
            margin-bottom: 15px;
          }
          .footer-text {
            font-size: 13px;
            color: #6c757d;
            line-height: 1.8;
            margin-bottom: 10px;
          }
          .footer-copyright {
            font-size: 12px; 
            color: #adb5bd;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #dee2e6, transparent);
            margin: 30px 0;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              padding: 20px 10px;
            }
            .content {
              padding: 30px 25px;
            }
            .header {
              padding: 30px 20px;
            }
            .header h1 {
              font-size: 26px;
            }
            .code-box {
              font-size: 32px;
              letter-spacing: 8px;
              padding: 25px 20px;
              min-width: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
        <div class="email-container">
          <div class="header">
              <div class="logo-container">
                ${(environment.emailjs as any)?.logoUrl 
                  ? `<img src="${(environment.emailjs as any).logoUrl}" alt="Logo AcademicSystem" class="logo-placeholder" />`
                  : `<div class="logo-placeholder">🎓</div>`
                }
              </div>
            <h1>AcademicSystem</h1>
            <h2>Código de Verificación</h2>
          </div>
            
          <div class="content">
              <div class="greeting">
                Hola <strong>${nombreUsuario}</strong>,
              </div>
              
              <div class="message">
                Has solicitado restablecer tu contraseña. Para continuar, utiliza el siguiente código de verificación de 6 dígitos:
              </div>
              
              <div class="code-container">
                <div class="code-label">Tu Código de Verificación</div>
            <div class="code-box">${code}</div>
              </div>
              
              <div class="divider"></div>
              
              <div class="warning-box">
                <div class="warning-icon">⏰</div>
                <div class="warning-content">
                  <div class="warning-title">Código con Tiempo Limitado</div>
                  <div class="warning-text">Este código expira en 15 minutos. Si no lo usas a tiempo, deberás solicitar uno nuevo.</div>
                </div>
            </div>
            
              <div class="info-box">
                <div class="info-icon">🔒</div>
                <div class="info-content">
                  <div class="info-title">Seguridad de tu Cuenta</div>
                  <div class="info-text">Si no solicitaste este cambio de contraseña, puedes ignorar este email de forma segura. Tu cuenta permanecerá protegida y no se realizará ningún cambio.</div>
                </div>
            </div>
            
              <div class="message" style="margin-top: 30px;">
                Ingresa este código en la página de verificación para continuar con el proceso de restablecimiento de contraseña.
          </div>
            </div>
            
          <div class="footer">
              <div class="footer-logo">AcademicSystem</div>
              <div class="footer-text">
                Sistema de Gestión Académica<br>
                Plataforma educativa integral
              </div>
              <div class="footer-copyright">
                © 2024 AcademicSystem. Todos los derechos reservados.<br>
                Este es un email automático, por favor no respondas.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para confirmación de cambio de contraseña
   */
  private getPasswordChangedTemplate(nombreUsuario: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Contraseña Cambiada - AcademicSystem</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333333; 
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-color: #f5f7fa;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .email-wrapper {
            padding: 40px 20px;
            min-height: 100vh;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
            color: white; 
            padding: 40px 30px;
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          .logo-container {
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }
          .logo-placeholder {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            backdrop-filter: blur(10px);
            border: 3px solid rgba(255, 255, 255, 0.3);
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 400;
            opacity: 0.95;
            position: relative;
            z-index: 1;
          }
          .content { 
            padding: 50px 40px;
            background: #ffffff; 
            text-align: center;
          }
          .success-icon-container {
            margin: 30px 0 40px;
          }
          .success-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto;
            background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
            animation: bounce 1s ease-in-out;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .greeting {
            font-size: 24px;
            color: #333333;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .greeting strong {
            color: #4caf50;
            font-weight: 700;
          }
          .message {
            font-size: 16px;
            color: #555555;
            margin-bottom: 30px;
            line-height: 1.8;
            text-align: left;
          }
          .success-box {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border: 2px solid #2b7bcc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: left;
          }
          .success-title {
            color: #1565c0;
            font-weight: 600;
            font-size: 18px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .success-text {
            color: #0d47a1;
            font-size: 15px;
            line-height: 1.7;
          }
          .warning-box { 
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            border-left: 4px solid #ff9800;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            display: flex;
            align-items: flex-start;
            gap: 15px;
            text-align: left;
          }
          .warning-icon {
            font-size: 24px;
            flex-shrink: 0;
          }
          .warning-content {
            flex: 1;
          }
          .warning-title {
            color: #e65100;
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .warning-text {
            color: #bf360c;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer { 
            text-align: center; 
            padding: 40px 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-top: 1px solid #dee2e6;
          }
          .footer-logo {
            font-size: 20px;
            font-weight: 700;
            color: #2b7bcc;
            margin-bottom: 15px;
          }
          .footer-text {
            font-size: 13px;
            color: #6c757d;
            line-height: 1.8;
            margin-bottom: 10px;
          }
          .footer-copyright {
            font-size: 12px; 
            color: #adb5bd;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              padding: 20px 10px;
            }
            .content {
              padding: 30px 25px;
            }
            .header {
              padding: 30px 20px;
            }
            .header h1 {
              font-size: 26px;
            }
            .success-icon {
              width: 80px;
              height: 80px;
              font-size: 40px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
        <div class="email-container">
          <div class="header">
              <div class="logo-container">
                ${(environment.emailjs as any)?.logoUrl 
                  ? `<img src="${(environment.emailjs as any).logoUrl}" alt="Logo AcademicSystem" class="logo-placeholder" />`
                  : `<div class="logo-placeholder">🎓</div>`
                }
              </div>
            <h1>AcademicSystem</h1>
            <h2>Contraseña Cambiada Exitosamente</h2>
          </div>
            
          <div class="content">
              <div class="success-icon-container">
            <div class="success-icon">✅</div>
              </div>
            
              <div class="greeting">
                ¡Hola <strong>${nombreUsuario}</strong>!
            </div>
              
              <div class="message">
                Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión en AcademicSystem con tu nueva contraseña.
          </div>
              
              <div class="success-box">
                <div class="success-title">
                  <span>🔐</span>
                  <span>Cambio Completado</span>
                </div>
                <div class="success-text">
                  Tu cuenta está protegida con la nueva contraseña. Te recomendamos mantenerla segura y no compartirla con nadie.
                </div>
              </div>
              
              <div class="warning-box">
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                  <div class="warning-title">¿No realizaste este cambio?</div>
                  <div class="warning-text">Si no solicitaste este cambio de contraseña, contacta inmediatamente al administrador de tu institución para proteger tu cuenta.</div>
                </div>
              </div>
            </div>
            
          <div class="footer">
              <div class="footer-logo">AcademicSystem</div>
              <div class="footer-text">
                Sistema de Gestión Académica<br>
                Plataforma educativa integral
              </div>
              <div class="footer-copyright">
                © 2024 AcademicSystem. Todos los derechos reservados.<br>
                Este es un email automático, por favor no respondas.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML para email con nueva contraseña
   */
  private getNewPasswordTemplate(newPassword: string, nombreUsuario: string, username?: string, userEmail?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Tu Nueva Contraseña - AcademicSystem</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333333; 
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-color: #f5f7fa;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .email-wrapper {
            padding: 40px 20px;
            min-height: 100vh;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
            color: white; 
            padding: 40px 30px;
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          .logo-container {
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }
          .logo-placeholder {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            backdrop-filter: blur(10px);
            border: 3px solid rgba(255, 255, 255, 0.3);
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 400;
            opacity: 0.95;
            position: relative;
            z-index: 1;
          }
          .content { 
            padding: 50px 40px;
            background: #ffffff; 
          }
          .success-icon-container {
            margin: 30px 0 40px;
            text-align: center;
          }
          .success-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto;
            background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
            animation: bounce 1s ease-in-out;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .greeting {
            font-size: 24px;
            color: #333333;
            margin-bottom: 20px;
            font-weight: 600;
            text-align: center;
          }
          .greeting strong {
            color: #4caf50;
            font-weight: 700;
          }
          .message {
            font-size: 16px;
            color: #555555;
            margin-bottom: 35px;
            line-height: 1.8;
            text-align: center;
          }
          .password-container {
            margin: 40px 0;
            text-align: center;
          }
          .password-label {
            font-size: 14px;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .password-box { 
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border: 3px solid #2b7bcc;
            border-radius: 12px;
            padding: 30px 25px;
            text-align: center; 
            font-size: 28px; 
            font-weight: 700;
            margin: 0 auto;
            font-family: 'Courier New', 'Monaco', monospace;
            color: #1565c0;
            box-shadow: 0 4px 15px rgba(43, 123, 204, 0.2);
            display: inline-block;
            min-width: 200px;
            word-break: break-all;
            position: relative;
            overflow: hidden;
          }
          .password-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shine 3s infinite;
          }
          @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          .info-box {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-left: 4px solid #2196f3;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .info-icon {
            font-size: 24px;
            flex-shrink: 0;
          }
          .info-content {
            flex: 1;
          }
          .info-title {
            color: #1565c0;
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .info-text {
            color: #0d47a1;
            font-size: 14px;
            line-height: 1.6;
          }
          .warning-box { 
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            border-left: 4px solid #ff9800;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .warning-icon {
            font-size: 24px;
            flex-shrink: 0;
          }
          .warning-content {
            flex: 1;
          }
          .warning-title {
            color: #e65100;
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .warning-text {
            color: #bf360c;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer { 
            text-align: center; 
            padding: 40px 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-top: 1px solid #dee2e6;
          }
          .footer-logo {
            font-size: 20px;
            font-weight: 700;
            color: #2b7bcc;
            margin-bottom: 15px;
          }
          .footer-text {
            font-size: 13px;
            color: #6c757d;
            line-height: 1.8;
            margin-bottom: 10px;
          }
          .footer-copyright {
            font-size: 12px; 
            color: #adb5bd;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #dee2e6, transparent);
            margin: 30px 0;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              padding: 20px 10px;
            }
            .content {
              padding: 30px 25px;
            }
            .header {
              padding: 30px 20px;
            }
            .header h1 {
              font-size: 26px;
            }
            .password-box {
              font-size: 22px;
              padding: 25px 20px;
              min-width: auto;
          }
          .success-icon {
              width: 80px;
              height: 80px;
              font-size: 40px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
        <div class="email-container">
          <div class="header">
              <div class="logo-container">
                ${(environment.emailjs as any)?.logoUrl 
                  ? `<img src="${(environment.emailjs as any).logoUrl}" alt="Logo AcademicSystem" class="logo-placeholder" />`
                  : `<div class="logo-placeholder">🎓</div>`
                }
              </div>
            <h1>AcademicSystem</h1>
            <h2>Tu Nueva Contraseña</h2>
          </div>
            
          <div class="content">
              <div class="success-icon-container">
            <div class="success-icon">🔑</div>
              </div>
              
              <div class="greeting">
                ¡Hola <strong>${nombreUsuario}</strong>!
              </div>
              
              <div class="message">
                Tu contraseña ha sido restablecida exitosamente. Aquí están tus credenciales de acceso:
              </div>
              
              <div class="info-box" style="margin-bottom: 30px; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4caf50;">
                <div class="info-icon">👤</div>
                <div class="info-content">
                  <div class="info-title" style="color: #2e7d32;">Tus Credenciales de Acceso</div>
                  <div class="info-text" style="margin-top: 10px; color: #1b5e20; font-size: 15px; line-height: 2;">
                    ${username ? `<strong>Usuario:</strong> <span style="font-family: 'Courier New', monospace; background: rgba(255,255,255,0.5); padding: 4px 8px; border-radius: 4px;">${username}</span><br><br>` : ''}
                    ${userEmail ? `<strong>Email:</strong> <span style="font-family: 'Courier New', monospace; background: rgba(255,255,255,0.5); padding: 4px 8px; border-radius: 4px;">${userEmail}</span><br><br>` : ''}
                  </div>
                </div>
              </div>
              
              <div class="password-container">
                <div class="password-label">Tu Nueva Contraseña</div>
                <div class="password-box">${newPassword}</div>
              </div>
              
              <div class="divider"></div>
              
              <div class="info-box">
                <div class="info-icon">💡</div>
                <div class="info-content">
                  <div class="info-title">Guarda tus Credenciales</div>
                  <div class="info-text">Por favor, guarda esta información en un lugar seguro. Puedes iniciar sesión con tu ${username ? 'usuario o ' : ''}email y la nueva contraseña. También puedes cambiarla nuevamente desde tu perfil una vez que inicies sesión en AcademicSystem.</div>
                </div>
              </div>
            
              <div class="warning-box">
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                  <div class="warning-title">Seguridad de tu Cuenta</div>
                  <div class="warning-text">Si no solicitaste este cambio de contraseña, contacta inmediatamente al administrador de tu institución para proteger tu cuenta.</div>
                </div>
            </div>
            
              <div class="message" style="margin-top: 30px;">
                Ahora puedes iniciar sesión en AcademicSystem con esta nueva contraseña.
          </div>
            </div>
            
          <div class="footer">
              <div class="footer-logo">AcademicSystem</div>
              <div class="footer-text">
                Sistema de Gestión Académica<br>
                Plataforma educativa integral
              </div>
              <div class="footer-copyright">
                © 2024 AcademicSystem. Todos los derechos reservados.<br>
                Este es un email automático, por favor no respondas.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
