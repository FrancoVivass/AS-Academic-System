import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  
  constructor() { }

  /**
   * Exportar datos de asistencia a Excel
   */
  exportarAsistenciaAExcel(
    datos: any[],
    nombreArchivo: string = 'asistencia',
    estadisticas?: any
  ): void {
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();

    // Hoja 1: Datos detallados de asistencia
    const ws1 = XLSX.utils.json_to_sheet(datos, {
      header: [
        'Alumno',
        'Materia',
        'Fecha',
        'Estado',
        'Presente',
        'Tardanza',
        'Ausente',
        'Justificado'
      ]
    });

    // Ajustar ancho de columnas
    ws1['!cols'] = [
      { wch: 25 }, // Alumno
      { wch: 25 }, // Materia
      { wch: 15 }, // Fecha
      { wch: 15 }, // Estado
      { wch: 10 }, // Presente
      { wch: 10 }, // Tardanza
      { wch: 10 }, // Ausente
      { wch: 12 }  // Justificado
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Asistencia');

    // Hoja 2: Estadísticas (si se proporciona)
    if (estadisticas && estadisticas.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(estadisticas, {
        header: [
          'Alumno',
          'Materia',
          'Total Clases',
          'Presentes',
          'Ausentes',
          'Tardanzas',
          'Justificados',
          'Porcentaje Asistencia'
        ]
      });

      ws2['!cols'] = [
        { wch: 25 }, // Alumno
        { wch: 25 }, // Materia
        { wch: 14 }, // Total Clases
        { wch: 12 }, // Presentes
        { wch: 12 }, // Ausentes
        { wch: 12 }, // Tardanzas
        { wch: 14 }, // Justificados
        { wch: 15 }  // Porcentaje
      ];

      XLSX.utils.book_append_sheet(wb, ws2, 'Estadísticas');
    }

    // Generar y descargar el archivo
    const fechaActual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${nombreArchivo}_${fechaActual}.xlsx`);
  }

  /**
   * Exportar reporte general de asistencia con múltiples hojas
   */
  exportarReporteGeneralAsistencia(
    reporteData: {
      materias: any[];
      alumnos: any[];
      estadisticas: any[];
    },
    nombreArchivo: string = 'reporte-asistencia'
  ): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen por Materia
    if (reporteData.materias && reporteData.materias.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(reporteData.materias);
      ws1['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Materias');
    }

    // Hoja 2: Resumen por Alumno
    if (reporteData.alumnos && reporteData.alumnos.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(reporteData.alumnos);
      ws2['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Resumen Alumnos');
    }

    // Hoja 3: Estadísticas detalladas
    if (reporteData.estadisticas && reporteData.estadisticas.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(reporteData.estadisticas);
      ws3['!cols'] = [
        { wch: 25 },
        { wch: 25 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws3, 'Estadísticas');
    }

    const fechaActual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${nombreArchivo}_${fechaActual}.xlsx`);
  }

  /**
   * Exportar datos genéricos a Excel con formato personalizado
   */
  exportarDatosAExcel(
    datos: any[],
    columnas: string[],
    nombreArchivo: string = 'datos'
  ): void {
    if (!datos || datos.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(datos, { header: columnas });
    
    // Ajustar ancho basado en la cantidad de columnas
    const columnsWidth = columnas.map(() => ({ wch: 18 }));
    ws['!cols'] = columnsWidth;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    const fechaActual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${nombreArchivo}_${fechaActual}.xlsx`);
  }
}
