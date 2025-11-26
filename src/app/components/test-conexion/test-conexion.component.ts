import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-test-conexion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './test-conexion.component.html',
  styleUrl: './test-conexion.component.css'
})
export class TestConexionComponent implements OnInit {
  probando = false;
  resultado: {
    conexion: boolean;
    mensaje: string;
    detalles?: any;
    error?: any;
  } | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Probar automáticamente al cargar
    this.probarConexion();
  }

  async probarConexion(): Promise<void> {
    this.probando = true;
    this.resultado = null;

    try {
      // Prueba 1: Verificar que el cliente se creó correctamente
      const client = this.supabaseService.client;
      if (!client) {
        throw new Error('Cliente de Supabase no inicializado');
      }

      // Prueba 2: Intentar una consulta simple (incluso si la tabla no existe, debería dar un error de tabla, no de conexión)
      try {
        // Intentar consultar una tabla que debería existir después de ejecutar los scripts
        const { data, error } = await client
          .from('instituciones')
          .select('count')
          .limit(1);

        if (error) {
          // Si el error es que la tabla no existe, la conexión funciona pero faltan las tablas
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            this.resultado = {
              conexion: true,
              mensaje: 'Conexión exitosa, pero las tablas aún no están creadas',
              detalles: {
                tipo: 'warning',
                mensaje: 'La conexión funciona correctamente. Necesitas ejecutar los scripts SQL para crear las tablas.',
                error: error.message
              }
            };
            this.snackBar.open('Conexión OK, pero faltan las tablas', 'Cerrar', {
              duration: 5000
            });
            return;
          }
          throw error;
        }

        // Si llegamos aquí, la conexión funciona y las tablas existen
        this.resultado = {
          conexion: true,
          mensaje: 'Conexión exitosa con Supabase',
          detalles: {
            tipo: 'success',
            mensaje: 'La conexión funciona correctamente y las tablas están creadas.',
            registros: data
          }
        };
        this.snackBar.open('Conexión exitosa!', 'Cerrar', {
          duration: 3000
        });

      } catch (tableError: any) {
        // Error al consultar la tabla
        if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
          this.resultado = {
            conexion: true,
            mensaje: 'Conexión exitosa, pero las tablas aún no están creadas',
            detalles: {
              tipo: 'warning',
              mensaje: 'La conexión funciona correctamente. Necesitas ejecutar los scripts SQL para crear las tablas.',
              instrucciones: 'Ve a INSTRUCCIONES_SQL.md para ver cómo crear las tablas'
            }
          };
        } else {
          throw tableError;
        }
      }

    } catch (error: any) {
      console.error('Error de conexión:', error);
      this.resultado = {
        conexion: false,
        mensaje: 'Error de conexión con Supabase',
        error: {
          mensaje: error.message || 'Error desconocido',
          detalles: error
        }
      };
      this.snackBar.open('Error de conexión', 'Cerrar', {
        duration: 5000
      });
    } finally {
      this.probando = false;
    }
  }

  async probarConsultaCompleta(): Promise<void> {
    this.probando = true;
    
    try {
      // Intentar obtener todas las instituciones
      const instituciones = await this.supabaseService.getAll('instituciones');
      
      this.resultado = {
        conexion: true,
        mensaje: `Consulta exitosa: ${instituciones.length} instituciones encontradas`,
        detalles: {
          tipo: 'success',
          cantidad: instituciones.length,
          datos: instituciones
        }
      };
      
      this.snackBar.open(`${instituciones.length} instituciones encontradas`, 'Cerrar', {
        duration: 3000
      });
    } catch (error: any) {
      this.resultado = {
        conexion: false,
        mensaje: 'Error al consultar datos',
        error: {
          mensaje: error.message || 'Error desconocido',
          detalles: error
        }
      };
      this.snackBar.open('Error al consultar', 'Cerrar', {
        duration: 5000
      });
    } finally {
      this.probando = false;
    }
  }

  limpiarResultado(): void {
    this.resultado = null;
  }
}

