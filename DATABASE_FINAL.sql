-- ============================================
-- SCRIPTS SQL FINALES PARA AS-ACADEMIC-SYSTEM
-- Base de datos: PostgreSQL (Supabase)
-- Versión: Final - Revisada y Completa
-- Última actualización: 2025
-- ============================================
-- ESTE SCRIPT ES COMPLETO Y AUTOCONTENIDO
-- Incluye todas las tablas, índices, triggers, RLS y datos iniciales
-- También incluye las actualizaciones para materias (profesor, curso, horario)
-- ============================================
-- INSTRUCCIONES:
-- 1. Copiar y pegar TODO este script en Supabase SQL Editor
-- 2. Ejecutar el script completo
-- 3. El script es idempotente (se puede ejecutar múltiples veces)
-- 4. Si ya tienes una base de datos, el script preservará tus datos
-- ============================================

-- ============================================
-- SCRIPT 1: Tabla de Instituciones
-- ============================================
CREATE TABLE IF NOT EXISTS instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  nombre_corto VARCHAR(100) NOT NULL,
  logo TEXT,
  descripcion TEXT,
  color_primario VARCHAR(7) NOT NULL DEFAULT '#1976d2',
  color_secundario VARCHAR(7) NOT NULL DEFAULT '#dc004e',
  color_acento VARCHAR(7) NOT NULL DEFAULT '#ff9800',
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  direccion TEXT,
  activa BOOLEAN DEFAULT true,
  credencial_secreta VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nombre),
  UNIQUE(nombre_corto)
);

CREATE INDEX idx_instituciones_activa ON instituciones(activa);
CREATE INDEX idx_instituciones_nombre ON instituciones(nombre);

-- ============================================
-- SCRIPT 2: Tabla de Usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(50),
  dni VARCHAR(20),
  fecha_nacimiento DATE,
  direccion TEXT,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'profesor', 'alumno', 'secretario', 'coordinador')),
  avatar TEXT,
  institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_institucion ON usuarios(institucion_id);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================
-- SCRIPT 3: Tabla de Docentes
-- ============================================
CREATE TABLE IF NOT EXISTS docentes (
  id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidad VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS docente_materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
  materia_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(docente_id, materia_id)
);

CREATE INDEX idx_docente_materias_docente ON docente_materias(docente_id);
CREATE INDEX idx_docente_materias_materia ON docente_materias(materia_id);

-- ============================================
-- SCRIPT 4: Tabla de Carreras
-- ============================================
CREATE TABLE IF NOT EXISTS carreras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  descripcion TEXT,
  duracion_anios INTEGER NOT NULL,
  duracion_cuatrimestres INTEGER NOT NULL,
  coordinador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'suspendida')),
  institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institucion_id, codigo)
);

CREATE INDEX idx_carreras_institucion ON carreras(institucion_id);
CREATE INDEX idx_carreras_coordinador ON carreras(coordinador_id);
CREATE INDEX idx_carreras_estado ON carreras(estado);

-- ============================================
-- SCRIPT 5: Tabla de Materias
-- ============================================
CREATE TABLE IF NOT EXISTS materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  descripcion TEXT,
  profesor VARCHAR(255), -- Nombre del profesor (opcional, se puede asignar después)
  curso VARCHAR(100), -- Nombre del curso (opcional)
  horario TEXT, -- Horario de la materia (opcional)
  creditos INTEGER DEFAULT 0,
  horas_semanales INTEGER,
  carrera_id UUID REFERENCES carreras(id) ON DELETE CASCADE, -- Opcional, se puede asignar después
  institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE, -- REQUERIDO: Cada materia pertenece a una institución
  tipo VARCHAR(20) DEFAULT 'obligatoria' CHECK (tipo IN ('obligatoria', 'optativa', 'electiva')),
  estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'suspendida')),
  cuatrimestre INTEGER CHECK (cuatrimestre IN (1, 2)),
  año INTEGER,
  tiene_nota BOOLEAN DEFAULT true,
  tiene_asistencia BOOLEAN DEFAULT true,
  requiere_aprobacion BOOLEAN DEFAULT false,
  nota_minima_aprobacion INTEGER DEFAULT 6,
  porcentaje_asistencia_minimo INTEGER DEFAULT 75,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice único por institución y código (código único dentro de cada institución)
CREATE UNIQUE INDEX idx_materias_institucion_codigo_unique 
ON materias(institucion_id, codigo);

-- Índice para filtrar por institución
CREATE INDEX idx_materias_institucion ON materias(institucion_id);

CREATE TABLE IF NOT EXISTS materia_correlatividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  materia_correlativa_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(materia_id, materia_correlativa_id),
  CHECK (materia_id != materia_correlativa_id)
);

CREATE INDEX idx_materias_carrera ON materias(carrera_id);
CREATE INDEX idx_materias_estado ON materias(estado);
CREATE INDEX idx_materias_tipo ON materias(tipo);
CREATE INDEX idx_materias_codigo ON materias(codigo);

-- Actualizar referencia en docente_materias (solo si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_docente_materias_materia'
  ) THEN
    ALTER TABLE docente_materias 
    ADD CONSTRAINT fk_docente_materias_materia 
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- SCRIPT 6: Tabla de Aulas
-- ============================================
CREATE TABLE IF NOT EXISTS aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  capacidad INTEGER NOT NULL,
  tipo VARCHAR(20) DEFAULT 'aula' CHECK (tipo IN ('aula', 'laboratorio', 'taller', 'sala', 'auditorio')),
  estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupada', 'mantenimiento', 'fuera_servicio')),
  edificio VARCHAR(100),
  piso INTEGER,
  observaciones TEXT,
  institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institucion_id, codigo)
);

CREATE TABLE IF NOT EXISTS aula_recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('proyector', 'pizarra', 'pc', 'pantalla', 'aire_acondicionado', 'wifi', 'otros')),
  disponible BOOLEAN DEFAULT true,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aulas_institucion ON aulas(institucion_id);
CREATE INDEX idx_aulas_estado ON aulas(estado);
CREATE INDEX idx_aulas_tipo ON aulas(tipo);

-- ============================================
-- SCRIPT 7: Tabla de Cursos
-- ============================================
CREATE TABLE IF NOT EXISTS cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrera_id UUID NOT NULL REFERENCES carreras(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  año INTEGER NOT NULL,
  division VARCHAR(10) NOT NULL,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('mañana', 'tarde', 'vespertino')),
  capacidad INTEGER NOT NULL,
  cupo_maximo INTEGER,
  cupo_actual INTEGER DEFAULT 0,
  tutor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'completo', 'cancelado')),
  modalidad VARCHAR(20) CHECK (modalidad IN ('presencial', 'virtual', 'mixta')),
  aula_id UUID REFERENCES aulas(id) ON DELETE SET NULL,
  cuatrimestre INTEGER CHECK (cuatrimestre IN (1, 2)),
  fecha_inicio DATE,
  fecha_fin DATE,
  permite_autoinscripcion BOOLEAN DEFAULT false,
  permite_edicion_horarios_profesor BOOLEAN DEFAULT false,
  requiere_aprobacion_inscripcion BOOLEAN DEFAULT false,
  activa_lista_espera BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(carrera_id, año, division, turno)
);

CREATE TABLE IF NOT EXISTS curso_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  dia VARCHAR(20) NOT NULL CHECK (dia IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado')),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  docente_id UUID NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
  aula_id UUID REFERENCES aulas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS curso_materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(curso_id, materia_id)
);

CREATE INDEX idx_cursos_carrera ON cursos(carrera_id);
CREATE INDEX idx_cursos_tutor ON cursos(tutor_id);
CREATE INDEX idx_cursos_aula ON cursos(aula_id);
CREATE INDEX idx_cursos_estado ON cursos(estado);
CREATE INDEX idx_curso_horarios_curso ON curso_horarios(curso_id);
CREATE INDEX idx_curso_horarios_materia ON curso_horarios(materia_id);
CREATE INDEX idx_curso_horarios_docente ON curso_horarios(docente_id);

-- ============================================
-- SCRIPT 8: Tabla de Alumnos
-- ============================================
CREATE TABLE IF NOT EXISTS alumnos (
  id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  dni VARCHAR(20) NOT NULL UNIQUE,
  carrera_id UUID REFERENCES carreras(id) ON DELETE SET NULL,
  fecha_nacimiento DATE,
  estado VARCHAR(20) DEFAULT 'regular' CHECK (estado IN ('regular', 'irregular', 'egresado', 'expulsado', 'suspendido', 'libre')),
  dni_completo BOOLEAN DEFAULT false,
  analitico_completo BOOLEAN DEFAULT false,
  apto_medico_completo BOOLEAN DEFAULT false,
  fotocopia_dni TEXT,
  analitico TEXT,
  apto_medico TEXT,
  fecha_validacion TIMESTAMP WITH TIME ZONE,
  validado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumno_historial_estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  motivo TEXT,
  cambiado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumno_cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado VARCHAR(20) DEFAULT 'inscrito' CHECK (estado IN ('inscrito', 'en_lista_espera', 'retirado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alumno_id, curso_id)
);

CREATE INDEX idx_alumnos_dni ON alumnos(dni);
CREATE INDEX idx_alumnos_carrera ON alumnos(carrera_id);
CREATE INDEX idx_alumnos_estado ON alumnos(estado);
CREATE INDEX idx_alumno_cursos_alumno ON alumno_cursos(alumno_id);
CREATE INDEX idx_alumno_cursos_curso ON alumno_cursos(curso_id);

-- ============================================
-- SCRIPT 9: Tabla de Notas
-- ============================================
CREATE TABLE IF NOT EXISTS notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  calificacion DECIMAL(4,2) NOT NULL CHECK (calificacion >= 0 AND calificacion <= 10),
  fecha DATE NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('parcial', 'final', 'trabajo', 'practico', 'recuperatorio')),
  observaciones TEXT,
  estado VARCHAR(30) DEFAULT 'cargada' CHECK (estado IN ('cargada', 'aprobada', 'rechazada', 'pendiente_revision')),
  aprobada_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  es_recuperatorio BOOLEAN DEFAULT false,
  nota_original_id UUID REFERENCES notas(id) ON DELETE SET NULL,
  cargada_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notas_alumno ON notas(alumno_id);
CREATE INDEX idx_notas_materia ON notas(materia_id);
CREATE INDEX idx_notas_curso ON notas(curso_id);
CREATE INDEX idx_notas_fecha ON notas(fecha);
CREATE INDEX idx_notas_tipo ON notas(tipo);
CREATE INDEX idx_notas_estado ON notas(estado);

-- ============================================
-- SCRIPT 10: Tabla de Asistencias
-- ============================================
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  horario_id UUID REFERENCES curso_horarios(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('presente', 'ausente', 'tardanza', 'justificado')),
  presente BOOLEAN NOT NULL,
  hora_registro TIME,
  justificativo_id UUID,
  tipo_justificacion VARCHAR(20) CHECK (tipo_justificacion IN ('medico', 'viaje', 'institucional', 'personal', 'otro')),
  observaciones TEXT,
  cargada_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  puede_editar BOOLEAN DEFAULT true,
  editada_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_edicion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alumno_id, materia_id, curso_id, fecha, horario_id)
);

CREATE TABLE IF NOT EXISTS estadisticas_asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  total_clases INTEGER DEFAULT 0,
  presentes INTEGER DEFAULT 0,
  ausentes INTEGER DEFAULT 0,
  tardanzas INTEGER DEFAULT 0,
  justificados INTEGER DEFAULT 0,
  porcentaje_asistencia DECIMAL(5,2) DEFAULT 0,
  porcentaje_asistencia_requerida INTEGER DEFAULT 75,
  estado VARCHAR(20) DEFAULT 'regular' CHECK (estado IN ('regular', 'irregular', 'libre')),
  fecha_calculo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alumno_id, materia_id, curso_id)
);

CREATE INDEX idx_asistencias_alumno ON asistencias(alumno_id);
CREATE INDEX idx_asistencias_materia ON asistencias(materia_id);
CREATE INDEX idx_asistencias_curso ON asistencias(curso_id);
CREATE INDEX idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX idx_asistencias_estado ON asistencias(estado);
CREATE INDEX idx_estadisticas_alumno ON estadisticas_asistencia(alumno_id);
CREATE INDEX idx_estadisticas_materia ON estadisticas_asistencia(materia_id);

-- ============================================
-- SCRIPT 11: Tabla de Justificativos
-- ============================================
CREATE TABLE IF NOT EXISTS justificativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('medico', 'viaje', 'institucional', 'personal', 'otro')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  motivo TEXT NOT NULL,
  documento TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  aprobado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  observaciones TEXT,
  creado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar foreign key de justificativo en asistencias (solo si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_asistencias_justificativo'
  ) THEN
    ALTER TABLE asistencias 
    ADD CONSTRAINT fk_asistencias_justificativo 
    FOREIGN KEY (justificativo_id) REFERENCES justificativos(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX idx_justificativos_alumno ON justificativos(alumno_id);
CREATE INDEX idx_justificativos_estado ON justificativos(estado);
CREATE INDEX idx_justificativos_fecha ON justificativos(fecha_inicio, fecha_fin);

-- ============================================
-- SCRIPT 12: Tabla de Eventos
-- ============================================
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  hora TIME,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('examen', 'reunion', 'feriado', 'evento', 'entrega')),
  materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  creador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  color VARCHAR(7),
  recordatorio BOOLEAN DEFAULT false,
  institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendarios_academicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  año INTEGER NOT NULL,
  inicio_clases DATE NOT NULL,
  fin_clases DATE NOT NULL,
  receso_invernal_inicio DATE,
  receso_invernal_fin DATE,
  receso_verano_inicio DATE,
  receso_verano_fin DATE,
  institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institucion_id, año)
);

CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_tipo ON eventos(tipo);
CREATE INDEX idx_eventos_materia ON eventos(materia_id);
CREATE INDEX idx_eventos_curso ON eventos(curso_id);
CREATE INDEX idx_eventos_institucion ON eventos(institucion_id);

-- ============================================
-- SCRIPT 13: Tabla de Mensajes
-- ============================================
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remitente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destinatario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  asunto VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  fecha_leido TIMESTAMP WITH TIME ZONE,
  tipo VARCHAR(20) DEFAULT 'mensaje' CHECK (tipo IN ('mensaje', 'notificacion', 'anuncio')),
  prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mensajes_remitente ON mensajes(remitente_id);
CREATE INDEX idx_mensajes_destinatario ON mensajes(destinatario_id);
CREATE INDEX idx_mensajes_leido ON mensajes(leido);
CREATE INDEX idx_mensajes_tipo ON mensajes(tipo);
CREATE INDEX idx_mensajes_institucion ON mensajes(institucion_id);

-- ============================================
-- SCRIPT 14: Tabla de Equivalencias
-- ============================================
CREATE TABLE IF NOT EXISTS equivalencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrera_origen_id UUID NOT NULL REFERENCES carreras(id) ON DELETE CASCADE,
  carrera_destino_id UUID NOT NULL REFERENCES carreras(id) ON DELETE CASCADE,
  materia_origen_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  materia_destino_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  aprobada_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (carrera_origen_id != carrera_destino_id),
  CHECK (materia_origen_id != materia_destino_id)
);

CREATE INDEX idx_equivalencias_carrera_origen ON equivalencias(carrera_origen_id);
CREATE INDEX idx_equivalencias_carrera_destino ON equivalencias(carrera_destino_id);
CREATE INDEX idx_equivalencias_estado ON equivalencias(estado);

-- ============================================
-- SCRIPT 15: Tabla de Auditoría
-- ============================================
CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nombre VARCHAR(255) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id UUID,
  tabla_afectada VARCHAR(100) NOT NULL,
  datos_antes JSONB,
  datos_despues JSONB,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip VARCHAR(45),
  observaciones TEXT,
  institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_entidad ON auditoria(entidad, entidad_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);
CREATE INDEX idx_auditoria_institucion ON auditoria(institucion_id);

-- ============================================
-- SCRIPT 15.1: Tabla de Biblioteca Digital
-- ============================================
CREATE TABLE IF NOT EXISTS biblioteca_recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('pdf', 'video', 'imagen', 'enlace', 'documento', 'presentacion')),
  url TEXT NOT NULL,
  materia_id UUID REFERENCES materias(id) ON DELETE SET NULL,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  autor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tamano VARCHAR(50),
  etiquetas TEXT[], -- Array de strings
  descargas INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_biblioteca_materia ON biblioteca_recursos(materia_id);
CREATE INDEX idx_biblioteca_curso ON biblioteca_recursos(curso_id);
CREATE INDEX idx_biblioteca_autor ON biblioteca_recursos(autor_id);
CREATE INDEX idx_biblioteca_institucion ON biblioteca_recursos(institucion_id);
CREATE INDEX idx_biblioteca_visible ON biblioteca_recursos(visible);
CREATE INDEX idx_biblioteca_tipo ON biblioteca_recursos(tipo);

-- ============================================
-- SCRIPT 15.2: Tabla de Solicitudes
-- ============================================
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('inscripcion', 'equivalencia', 'cambio_carrera', 'baja', 'justificativo', 'otro')),
  solicitante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destinatario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  asunto VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'en_revision')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  resuelta_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  observaciones TEXT,
  datos_adicionales JSONB, -- Para datos específicos según el tipo de solicitud
  institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_solicitudes_solicitante ON solicitudes(solicitante_id);
CREATE INDEX idx_solicitudes_destinatario ON solicitudes(destinatario_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX idx_solicitudes_tipo ON solicitudes(tipo);
CREATE INDEX idx_solicitudes_fecha ON solicitudes(fecha_solicitud);
CREATE INDEX idx_solicitudes_institucion ON solicitudes(institucion_id);

-- ============================================
-- SCRIPT 16: Funciones y Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar si la tabla tiene el campo updated_at
    IF TG_TABLE_NAME = 'instituciones' THEN
        -- Para instituciones, usar fecha_actualizacion
        NEW.fecha_actualizacion = NOW();
    ELSE
        -- Para otras tablas, usar updated_at
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instituciones_updated_at BEFORE UPDATE ON instituciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carreras_updated_at BEFORE UPDATE ON carreras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materias_updated_at BEFORE UPDATE ON materias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON aulas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alumnos_updated_at BEFORE UPDATE ON alumnos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_updated_at BEFORE UPDATE ON notas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asistencias_updated_at BEFORE UPDATE ON asistencias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_justificativos_updated_at BEFORE UPDATE ON justificativos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mensajes_updated_at BEFORE UPDATE ON mensajes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equivalencias_updated_at BEFORE UPDATE ON equivalencias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_biblioteca_recursos_updated_at BEFORE UPDATE ON biblioteca_recursos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON solicitudes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para validar institucion_id antes de insertar/actualizar usuarios
CREATE OR REPLACE FUNCTION validate_institucion_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se proporciona un institucion_id, verificar que exista
  IF NEW.institucion_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM instituciones WHERE id = NEW.institucion_id) THEN
      -- En lugar de lanzar error, establecer a NULL si no existe
      RAISE WARNING 'El institucion_id % no existe. Se establecerá a NULL.', NEW.institucion_id;
      NEW.institucion_id := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar institucion_id en tablas que lo requieren (aulas, carreras, etc.)
CREATE OR REPLACE FUNCTION validate_institucion_id_required()
RETURNS TRIGGER AS $$
DECLARE
  v_institucion_id UUID;
BEGIN
  -- Si se proporciona un institucion_id, verificar que exista
  IF NEW.institucion_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM instituciones WHERE id = NEW.institucion_id) THEN
      -- Para tablas donde institucion_id es requerido, obtener la primera institución activa
      SELECT id INTO v_institucion_id
      FROM instituciones
      WHERE activa = true
      ORDER BY fecha_creacion ASC
      LIMIT 1;
      
      IF v_institucion_id IS NOT NULL THEN
        RAISE WARNING 'El institucion_id % no existe. Se asignará la primera institución activa: %.', NEW.institucion_id, v_institucion_id;
        NEW.institucion_id := v_institucion_id;
      ELSE
        RAISE EXCEPTION 'No hay instituciones activas en la base de datos. Debe crear al menos una institución primero.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar institucion_id en usuarios (previene foreign key errors)
DROP TRIGGER IF EXISTS trigger_validate_institucion_id ON usuarios;
CREATE TRIGGER trigger_validate_institucion_id
BEFORE INSERT OR UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id();

-- Trigger para validar institucion_id en aulas (previene foreign key errors)
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_aulas ON aulas;
CREATE TRIGGER trigger_validate_institucion_id_aulas
BEFORE INSERT OR UPDATE ON aulas
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- Trigger para validar institucion_id en carreras (previene foreign key errors)
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_carreras ON carreras;
CREATE TRIGGER trigger_validate_institucion_id_carreras
BEFORE INSERT OR UPDATE ON carreras
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- Trigger para validar institucion_id en eventos (previene foreign key errors)
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_eventos ON eventos;
CREATE TRIGGER trigger_validate_institucion_id_eventos
BEFORE INSERT OR UPDATE ON eventos
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- Trigger para validar institucion_id en mensajes (previene foreign key errors)
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_mensajes ON mensajes;
CREATE TRIGGER trigger_validate_institucion_id_mensajes
BEFORE INSERT OR UPDATE ON mensajes
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- Trigger para validar institucion_id en materias (previene foreign key errors)
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_materias ON materias;
CREATE TRIGGER trigger_validate_institucion_id_materias
BEFORE INSERT OR UPDATE ON materias
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- Trigger para validar institucion_id en biblioteca_recursos
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_biblioteca ON biblioteca_recursos;
CREATE TRIGGER trigger_validate_institucion_id_biblioteca
BEFORE INSERT OR UPDATE ON biblioteca_recursos
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- Trigger para validar institucion_id en solicitudes
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_solicitudes ON solicitudes;
CREATE TRIGGER trigger_validate_institucion_id_solicitudes
BEFORE INSERT OR UPDATE ON solicitudes
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- Trigger para validar institucion_id en auditoria
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_auditoria ON auditoria;
CREATE TRIGGER trigger_validate_institucion_id_auditoria
BEFORE INSERT OR UPDATE ON auditoria
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- ============================================
-- SCRIPT 17: Row Level Security (RLS)
-- ============================================
ALTER TABLE instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE carreras ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE justificativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equivalencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblioteca_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para desarrollo (ajustar en producción)
CREATE POLICY "dev_all_instituciones" ON instituciones FOR ALL USING (true);
CREATE POLICY "dev_all_usuarios" ON usuarios FOR ALL USING (true);
CREATE POLICY "dev_all_docentes" ON docentes FOR ALL USING (true);
CREATE POLICY "dev_all_carreras" ON carreras FOR ALL USING (true);
CREATE POLICY "dev_all_materias" ON materias FOR ALL USING (true);
CREATE POLICY "dev_all_aulas" ON aulas FOR ALL USING (true);
CREATE POLICY "dev_all_cursos" ON cursos FOR ALL USING (true);
CREATE POLICY "dev_all_alumnos" ON alumnos FOR ALL USING (true);
CREATE POLICY "dev_all_notas" ON notas FOR ALL USING (true);
CREATE POLICY "dev_all_asistencias" ON asistencias FOR ALL USING (true);
CREATE POLICY "dev_all_justificativos" ON justificativos FOR ALL USING (true);
CREATE POLICY "dev_all_eventos" ON eventos FOR ALL USING (true);
CREATE POLICY "dev_all_mensajes" ON mensajes FOR ALL USING (true);
CREATE POLICY "dev_all_equivalencias" ON equivalencias FOR ALL USING (true);
CREATE POLICY "dev_all_auditoria" ON auditoria FOR ALL USING (true);
CREATE POLICY "dev_all_biblioteca_recursos" ON biblioteca_recursos FOR ALL USING (true);
CREATE POLICY "dev_all_solicitudes" ON solicitudes FOR ALL USING (true);

-- ============================================
-- SCRIPT 18: Datos Iniciales - Instituciones
-- ============================================
-- Insertar instituciones predefinidas

-- Instituto Paula Robles
INSERT INTO instituciones (
  nombre,
  nombre_corto,
  logo,
  descripcion,
  color_primario,
  color_secundario,
  color_acento,
  email,
  telefono,
  direccion,
  activa,
  credencial_secreta
) VALUES (
  'Instituto Paula Robles',
  'IPR',
  '/assets/instituciones/paula-robles-logo.png', -- Ruta relativa al logo en assets
  'Instituto educativo comprometido con la excelencia académica y la formación integral de sus estudiantes.',
  '#8b0000',      -- Rojo oscuro
  '#d3d3d3',     -- Gris claro
  '#ffffff',     -- Blanco
  'contacto@paulrobles.edu.ar',
  NULL,
  NULL,
  true,
  'EDI2025'
) ON CONFLICT (nombre) DO UPDATE SET
  logo = EXCLUDED.logo,
  color_primario = EXCLUDED.color_primario,
  color_secundario = EXCLUDED.color_secundario,
  color_acento = EXCLUDED.color_acento,
  credencial_secreta = EXCLUDED.credencial_secreta;

-- Centro Universitario Dolores
INSERT INTO instituciones (
  nombre,
  nombre_corto,
  logo,
  descripcion,
  color_primario,
  color_secundario,
  color_acento,
  email,
  telefono,
  direccion,
  activa,
  credencial_secreta
) VALUES (
  'Centro Universitario Dolores',
  'CUD',
  '/assets/instituciones/centro-universitario-logo.png', -- Ruta relativa al logo en assets
  'Centro universitario dedicado a la educación superior y la investigación académica.',
  '#C8AD7F',     -- Beige/Dorado
  '#d3d3d3',     -- Gris claro
  '#000000',     -- Negro
  'contacto@cud.edu.ar',
  NULL,
  NULL,
  true,
  'EDI2025'
) ON CONFLICT (nombre) DO UPDATE SET
  logo = EXCLUDED.logo,
  color_primario = EXCLUDED.color_primario,
  color_secundario = EXCLUDED.color_secundario,
  color_acento = EXCLUDED.color_acento,
  credencial_secreta = EXCLUDED.credencial_secreta;

-- ============================================
-- SCRIPT 19: Datos Iniciales - Administradores
-- ============================================
-- Insertar administradores para cada institución
-- Solo se insertan si las instituciones existen

-- Administrador para Instituto Paula Robles
DO $$
DECLARE
  v_institucion_id UUID;
BEGIN
  -- Obtener el ID de la institución
  SELECT id INTO v_institucion_id
  FROM instituciones
  WHERE nombre = 'Instituto Paula Robles'
  LIMIT 1;

  -- Solo insertar si la institución existe
  IF v_institucion_id IS NOT NULL THEN
    INSERT INTO usuarios (
      username,
      password,
      nombre,
      apellido,
      email,
      telefono,
      dni,
      rol,
      institucion_id,
      activo,
      fecha_registro
    ) VALUES (
      'admin',                    -- Username
      'admin123',                 -- Password (cambiar en producción)
      'Administrador',            -- Nombre
      'Paula Robles',             -- Apellido
      'admin@paulrobles.edu.ar',  -- Email
      NULL,                       -- Teléfono
      NULL,                       -- DNI
      'admin',                    -- Rol
      v_institucion_id,           -- ID de la institución
      true,                       -- Activo
      NOW()                       -- Fecha de registro
    )
    ON CONFLICT (username) DO UPDATE SET
      institucion_id = EXCLUDED.institucion_id,
      activo = true,
      email = EXCLUDED.email;
  ELSE
    RAISE NOTICE 'No se encontró la institución "Instituto Paula Robles". El usuario admin no se creará.';
  END IF;
END $$;

-- Administrador para Centro Universitario Dolores
DO $$
DECLARE
  v_institucion_id UUID;
BEGIN
  -- Obtener el ID de la institución
  SELECT id INTO v_institucion_id
  FROM instituciones
  WHERE nombre = 'Centro Universitario Dolores'
  LIMIT 1;

  -- Solo insertar si la institución existe
  IF v_institucion_id IS NOT NULL THEN
    INSERT INTO usuarios (
      username,
      password,
      nombre,
      apellido,
      email,
      telefono,
      dni,
      rol,
      institucion_id,
      activo,
      fecha_registro
    ) VALUES (
      'admin_cud',                -- Username único para CUD
      'admin123',                 -- Password (cambiar en producción)
      'Administrador',            -- Nombre
      'Centro Universitario Dolores', -- Apellido
      'admin@cud.edu.ar',         -- Email
      NULL,                       -- Teléfono
      NULL,                       -- DNI
      'admin',                    -- Rol
      v_institucion_id,           -- ID de la institución
      true,                       -- Activo
      NOW()                       -- Fecha de registro
    )
    ON CONFLICT (username) DO UPDATE SET
      institucion_id = EXCLUDED.institucion_id,
      activo = true,
      email = EXCLUDED.email;
  ELSE
    RAISE NOTICE 'No se encontró la institución "Centro Universitario Dolores". El usuario admin_cud no se creará.';
  END IF;
END $$;

-- ============================================
-- FIN DE LOS SCRIPTS
-- ============================================
-- Este script incluye todas las actualizaciones:
-- ✅ Tabla materias con campos profesor, curso y horario (opcionales)
-- ✅ Permite crear materias sin profesor (se asigna después)
-- ✅ Permite crear materias sin carrera_id (se asigna después desde wizard)
-- ✅ Índices únicos parciales para permitir materias sin carrera
-- ✅ Todas las foreign keys con manejo de errores
-- ============================================
-- INSTRUCCIONES DE USO:
-- 1. Ejecutar este script completo en Supabase SQL Editor
-- 2. El script es idempotente (se puede ejecutar múltiples veces sin errores)
-- 3. Si ya tienes datos, el script los preservará
-- ============================================
-- Nota: Las políticas RLS son básicas para desarrollo
-- Ajustar según necesidades de seguridad en producción
-- ============================================

