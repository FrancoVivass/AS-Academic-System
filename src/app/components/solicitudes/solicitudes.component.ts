import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { PermissionsService } from '../../services/permissions.service';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css'
})
export class SolicitudesComponent implements OnInit {
  solicitudes: any[] = [];
  displayedColumns: string[] = ['tipo', 'solicitante', 'fecha', 'estado', 'acciones'];

  constructor(public permissionsService: PermissionsService) {}

  ngOnInit(): void {
    // Cargar solicitudes pendientes
  }

  aprobarSolicitud(id: string): void {
    // Lógica de aprobación
  }

  rechazarSolicitud(id: string): void {
    // Lógica de rechazo
  }
}

