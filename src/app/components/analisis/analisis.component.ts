import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { ReportService } from '../../services/report.service';
import { PermissionsService } from '../../services/permissions.service';

@Component({
  selector: 'app-analisis',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule
  ],
  templateUrl: './analisis.component.html',
  styleUrl: './analisis.component.css'
})
export class AnalisisComponent implements OnInit {
  estadisticas: any = {};

  constructor(
    private reportService: ReportService,
    public permissionsService: PermissionsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadEstadisticas();
  }

  async loadEstadisticas(): Promise<void> {
    const reportesAlumnos = await this.reportService.generarReporteAlumnos();
    const reportesMaterias = await this.reportService.generarReporteMaterias();

    this.estadisticas = {
      totalAlumnos: reportesAlumnos.length,
      totalMaterias: reportesMaterias.length,
      promedioGeneral: this.calcularPromedio(reportesAlumnos),
      materiasConMasDesaprobados: this.getMateriasConMasDesaprobados(reportesMaterias),
      rendimientoPorProfesor: this.getRendimientoPorProfesor(reportesMaterias)
    };
  }

  calcularPromedio(reportes: any[]): number {
    if (reportes.length === 0) return 0;
    const suma = reportes.reduce((acc, r) => acc + r.promedio, 0);
    return Math.round((suma / reportes.length) * 100) / 100;
  }

  getMateriasConMasDesaprobados(reportes: any[]): any[] {
    return reportes
      .sort((a, b) => (b.cantidadInscritos - b.promedioGeneral) - (a.cantidadInscritos - a.promedioGeneral))
      .slice(0, 5);
  }

  getRendimientoPorProfesor(reportes: any[]): any[] {
    // Agrupar por profesor y calcular promedios
    return reportes.slice(0, 10);
  }
}

