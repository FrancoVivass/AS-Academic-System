import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { CarreraService } from '../../services/carrera.service';
import { NotificationService } from '../../services/notification.service';
import { PermissionsService } from '../../services/permissions.service';
import { AuthService } from '../../services/auth.service';
import { Equivalencia } from '../../models/carrera.model';

@Component({
  selector: 'app-equivalencias',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './equivalencias.component.html',
  styleUrl: './equivalencias.component.css'
})
export class EquivalenciasComponent implements OnInit {
  equivalencias: Equivalencia[] = [];
  displayedColumns: string[] = ['carreraOrigen', 'carreraDestino', 'materiaOrigen', 'materiaDestino', 'estado', 'acciones'];

  constructor(
    private carreraService: CarreraService,
    private notificationService: NotificationService,
    private authService: AuthService,
    public permissionsService: PermissionsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadEquivalencias();
  }

  async loadEquivalencias(): Promise<void> {
    this.equivalencias = await this.carreraService.getEquivalencias();
  }

  async aprobarEquivalencia(id: string): Promise<void> {
    const usuario = this.authService.getCurrentUser();
    if (usuario) {
      await this.carreraService.aprobarEquivalencia(id, usuario.id);
      this.notificationService.showSuccess('Equivalencia aprobada');
      await this.loadEquivalencias();
    }
  }
}

