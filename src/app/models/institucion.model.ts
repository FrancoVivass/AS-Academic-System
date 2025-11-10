export interface Institucion {
  id: string;
  nombre: string;
  nombreCorto: string;
  logo?: string;
  descripcion: string;
  colorPrimario: string;
  colorSecundario: string;
  colorAcento: string;
  email: string;
  telefono?: string;
  direccion?: string;
  activa: boolean;
  credencialSecreta: string; // Contraseña para acceder a esta institución
  fechaCreacion: string;
  fechaActualizacion: string;
}
