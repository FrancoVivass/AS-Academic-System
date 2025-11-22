import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../services/auditoria.service';
import { PermissionsService } from '../../services/permissions.service';
import { Auditoria } from '../../models/auditoria.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule
  ],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.css'
})
export class AuditoriaComponent implements OnInit {
  auditoria: Auditoria[] = [];
  displayedColumns: string[] = ['fecha', 'usuario', 'accion', 'entidad', 'tablaAfectada', 'detalles'];
  filtroEntidad: string = '';
  filtroAccion: string = '';

  constructor(
    private auditoriaService: AuditoriaService,
    public permissionsService: PermissionsService
  ) {}

  ngOnInit(): void {
    this.loadAuditoria();
  }

  loadAuditoria(): void {
    this.auditoria = this.auditoriaService.getAuditoriaReciente(100);
  }

  aplicarFiltros(): void {
    let auditoriaFiltrada = this.auditoriaService.getAuditoriaReciente(100);
    
    if (this.filtroEntidad) {
      auditoriaFiltrada = auditoriaFiltrada.filter(a => a.entidad === this.filtroEntidad);
    }
    
    if (this.filtroAccion) {
      auditoriaFiltrada = auditoriaFiltrada.filter(a => a.accion === this.filtroAccion);
    }
    
    this.auditoria = auditoriaFiltrada;
  }

  limpiarFiltros(): void {
    this.filtroEntidad = '';
    this.filtroAccion = '';
    this.loadAuditoria();
  }

  verDetalles(registro: Auditoria): void {
    alert(`Detalles:\nAntes: ${JSON.stringify(registro.datosAntes, null, 2)}\nDespués: ${JSON.stringify(registro.datosDespues, null, 2)}`);
  }
}

