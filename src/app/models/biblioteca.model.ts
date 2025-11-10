export interface RecursoBiblioteca {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'pdf' | 'video' | 'imagen' | 'enlace' | 'documento' | 'presentacion';
  url: string;
  materiaId?: string;
  cursoId?: string;
  autorId: string;
  fechaSubida: string;
  tamano?: string;
  etiquetas: string[];
  descargas: number;
  visible: boolean;
}

export interface CategoriaRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
}

