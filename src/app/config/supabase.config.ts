/**
 * Configuración de Supabase para AS-Academic-System
 * 
 * Base de datos: PostgreSQL en Supabase
 * URL: https://iujfqxfkpyeluqgtzdbd.supabase.co
 * 
 * Esta configuración contiene todos los datos necesarios para conectarse
 * a la base de datos del sistema académico.
 */

export const SUPABASE_CONFIG = {
  // Datos de conexión
  connection: {
    url: 'https://iujfqxfkpyeluqgtzdbd.supabase.co',
    anonKey: 'sb_publishable_vDB6DWBczNLrLI2Hf2GwSQ_GYGIQAFV',
    jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amZxeGZrcHllbHVxZ3R6ZGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDAwMDAsImV4cCI6MjA1Mjk3NjAwMH0.BFY0BTVl3dZugeRYD4aontyVuWeNw3kTI34yOmGz7Wo'
  },

  // Tablas del sistema académico
  tables: {
    // Administración
    instituciones: 'instituciones',
    usuarios: 'usuarios',
    
    // Académico
    carreras: 'carreras',
    materias: 'materias',
    docentes: 'docentes',
    alumnos: 'alumnos',
    cursos: 'cursos',
    
    // Evaluación
    notas: 'notas',
    asistencias: 'asistencias',
    justificativos: 'justificativos',
    
    // Recursos
    aulas: 'aulas',
    eventos: 'eventos',
    biblioteca_recursos: 'biblioteca_recursos',
    
    // Comunicación
    mensajes: 'mensajes',
    solicitudes: 'solicitudes',
    
    // Otros
    auditoria: 'auditoria',
    equivalencias: 'equivalencias'
  },

  // Instituciones predefinidas
  instituciones: {
    paula_robles: {
      nombre: 'Instituto Paula Robles',
      nombre_corto: 'IPR',
      color_primario: '#8b0000',
      color_secundario: '#d3d3d3',
      color_acento: '#ffffff'
    },
    centro_universitario_dolores: {
      nombre: 'Centro Universitario Dolores',
      nombre_corto: 'CUD',
      color_primario: '#C8AD7F',
      color_secundario: '#d3d3d3',
      color_acento: '#000000'
    }
  },

  // Usuarios por defecto
  defaultUsers: {
    admin_paula: {
      username: 'admin',
      password: 'admin123', // CAMBIAR EN PRODUCCIÓN
      email: 'admin@paulrobles.edu.ar',
      rol: 'admin'
    },
    admin_cud: {
      username: 'admin_cud',
      password: 'admin123', // CAMBIAR EN PRODUCCIÓN
      email: 'admin@cud.edu.ar',
      rol: 'admin'
    }
  },

  // Configuración de seguridad
  security: {
    enableRLS: true, // Row Level Security habilitado
    maxLoginAttempts: 5,
    sessionTimeout: 3600000, // 1 hora en ms
    passwordMinLength: 8
  },

  // Configuración de auditoría
  audit: {
    enableAuditLog: true,
    logAllOperations: true,
    retentionDays: 90
  }
};

/**
 * Guía de conexión:
 * 
 * 1. Las credenciales están en environment.ts
 * 2. El archivo BASEdedatos.sql contiene el schema completo
 * 3. Para ejecutar el schema:
 *    - Ve a Supabase Dashboard
 *    - SQL Editor
 *    - Copia y pega el contenido de BASEdedatos.sql
 *    - Ejecuta
 * 
 * 4. Las instituciones se crean automáticamente al ejecutar el schema
 * 5. Los usuarios admin se crean automáticamente
 * 
 * Credenciales de acceso inicial:
 * - Usuario: admin
 *   Contraseña: admin123
 *   Institución: Instituto Paula Robles
 * 
 * - Usuario: admin_cud
 *   Contraseña: admin123
 *   Institución: Centro Universitario Dolores
 */
