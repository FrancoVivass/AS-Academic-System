import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MigrationService } from '../../services/migration.service';

@Component({
  selector: 'app-migracion-datos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './migracion-datos.component.html',
  styleUrl: './migracion-datos.component.css'
})
export class MigracionDatosComponent implements OnInit {
  migrando = false;
  resultado: {
    success: boolean;
    message: string;
    details?: any;
  } | null = null;

  constructor(
    public migrationService: MigrationService, // Público para usar en template
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Verificar si ya se migró
    if (this.migrationService.isMigrated()) {
      this.resultado = {
        success: true,
        message: '✅ Los datos ya fueron migrados anteriormente'
      };
    }
  }

  async ejecutarMigracion(): Promise<void> {
    if (this.migrando) return;

    this.migrando = true;
    this.resultado = null;

    try {
      const resultado = await this.migrationService.migrateAll();
      this.resultado = resultado;

      if (resultado.success) {
        this.snackBar.open('✅ Migración completada exitosamente', 'Cerrar', {
          duration: 5000
        });
      } else {
        this.snackBar.open('❌ Error durante la migración', 'Cerrar', {
          duration: 5000
        });
      }
    } catch (error: any) {
      this.resultado = {
        success: false,
        message: 'Error inesperado durante la migración',
        details: { error: error.message }
      };
      this.snackBar.open('❌ Error inesperado', 'Cerrar', {
        duration: 5000
      });
    } finally {
      this.migrando = false;
    }
  }
}

