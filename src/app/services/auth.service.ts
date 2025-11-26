import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'gestion_academica_auth';
  private readonly USUARIOS_KEY = 'gestion_academica_usuarios';
  private useSupabase = true;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers(): Promise<void> {
    if (this.useSupabase) {
      try {
        const usuarios = await this.getUsuariosFromSupabase();
        if (usuarios.length === 0) {
          await this.createDefaultUsers();
        }
      } catch (error) {
        console.error('Error inicializando usuarios:', error);
        this.initializeDefaultUsersSync();
      }
    } else {
      this.initializeDefaultUsersSync();
    }
  }

  private initializeDefaultUsersSync(): void {
    const usuarios = this.getUsuariosFromStorage();
    if (usuarios.length === 0) {
      const defaultUsers: Usuario[] = [
        {
          id: '1',
          username: 'admin',
          password: '1234',
          nombre: 'Administrador',
          apellido: 'Sistema',
          email: 'admin@academia.edu',
          rol: 'admin',
          fechaRegistro: new Date().toISOString(),
          activo: true
        },
        {
          id: '2',
          username: 'profesor',
          password: '1234',
          nombre: 'Profesor',
          apellido: 'Demo',
          email: 'profesor@academia.edu',
          rol: 'profesor',
          fechaRegistro: new Date().toISOString(),
          activo: true
        }
      ];
      localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(defaultUsers));
    }
  }

  private async createDefaultUsers(): Promise<void> {
    const defaultUsers = [
      {
        id: '1',
        username: 'admin',
        password: '1234', // En producción debe estar hasheado
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@academia.edu',
        rol: 'admin',
        fecha_registro: new Date().toISOString(),
        activo: true
      },
      {
        id: '2',
        username: 'profesor',
        password: '1234',
        nombre: 'Profesor',
        apellido: 'Demo',
        email: 'profesor@academia.edu',
        rol: 'profesor',
        fecha_registro: new Date().toISOString(),
        activo: true
      }
    ];

    for (const user of defaultUsers) {
      try {
        await this.supabase.create('usuarios', user);
      } catch (error: any) {
        // Ignorar si ya existe
      }
    }
  }

  private mapDbToUsuario(db: any): Usuario {
    return {
      id: db.id,
      username: db.username,
      password: db.password, // Solo para uso interno
      nombre: db.nombre,
      apellido: db.apellido,
      email: db.email,
      telefono: db.telefono,
      dni: db.dni,
      fechaNacimiento: db.fecha_nacimiento,
      direccion: db.direccion,
      rol: db.rol,
      avatar: db.avatar,
      fechaRegistro: db.fecha_registro,
      activo: db.activo !== false,
      ultimoAcceso: db.ultimo_acceso,
      institucionId: db.institucion_id // Agregar para referencia
    } as Usuario & { institucionId?: string };
  }

  private mapUsuarioToDb(user: Usuario): any {
    // Obtener la institución actual para asignarla si no existe
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      dni: user.dni,
      fecha_nacimiento: user.fechaNacimiento,
      direccion: user.direccion,
      rol: user.rol,
      avatar: user.avatar,
      fecha_registro: user.fechaRegistro,
      activo: user.activo !== false,
      ultimo_acceso: user.ultimoAcceso,
      institucion_id: (user as any).institucionId || currentInstitucion?.id || null
    };
  }

  async login(username: string, password: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          console.error('No hay institución seleccionada');
          return false;
        }

        // Filtrar usuarios por institución
        let query = this.supabase.client
          .from('usuarios')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .eq('activo', true)
          .eq('institucion_id', currentInstitucion.id);

        const { data, error } = await query.single();

        if (error || !data) {
          return false;
        }

        const usuario = this.mapDbToUsuario(data);
        const { password: _, ...userWithoutPassword } = usuario;
        
        // Actualizar último acceso
        await this.supabase.client
          .from('usuarios')
          .update({ ultimo_acceso: new Date().toISOString() })
          .eq('id', usuario.id);

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
        this.currentUserSubject.next(userWithoutPassword as Usuario);
        return true;
      } catch (error) {
        console.error('Error en login:', error);
        return false;
      }
    } else {
      const usuarios = this.getUsuariosFromStorage();
      const usuario = usuarios.find(u => u.username === username && u.password === password);
      
      if (usuario) {
        const { password: _, ...userWithoutPassword } = usuario;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
        this.currentUserSubject.next(userWithoutPassword as Usuario);
        return true;
      }
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.getStoredUser() !== null;
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  private getStoredUser(): Usuario | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  async getUsuarios(): Promise<Usuario[]> {
    if (this.useSupabase) {
      try {
        return await this.getUsuariosFromSupabase();
      } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        return this.getUsuariosFromStorage();
      }
    } else {
      return this.getUsuariosFromStorage();
    }
  }

  private async getUsuariosFromSupabase(): Promise<Usuario[]> {
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    
    let query = this.supabase.client
      .from('usuarios')
      .select('*')
      .order('nombre', { ascending: true });

    // Si hay institución seleccionada, filtrar por ella
    if (currentInstitucion) {
      query = query.eq('institucion_id', currentInstitucion.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((db: any) => this.mapDbToUsuario(db));
  }

  private getUsuariosFromStorage(): Usuario[] {
    const stored = localStorage.getItem(this.USUARIOS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getUsuariosByRol(rol: string): Promise<Usuario[]> {
    const usuarios = await this.getUsuarios();
    return usuarios.filter(u => u.rol === rol && u.activo);
  }

  async getUsuarioById(id: string): Promise<Usuario | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('usuarios')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return undefined;
        return this.mapDbToUsuario(data);
      } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return undefined;
      }
    } else {
      return this.getUsuariosFromStorage().find(u => u.id === id);
    }
  }

  async updateUser(user: Usuario): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('usuarios', user.id, this.mapUsuarioToDb(user));
        
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === user.id) {
          const { password: _, ...userWithoutPassword } = user;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
          this.currentUserSubject.next(userWithoutPassword as Usuario);
        }
      } catch (error) {
        console.error('Error actualizando usuario:', error);
        throw error;
      }
    } else {
      const usuarios = this.getUsuariosFromStorage();
      const index = usuarios.findIndex(u => u.id === user.id);
      if (index !== -1) {
        usuarios[index] = user;
        localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(usuarios));
        
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === user.id) {
          const { password: _, ...userWithoutPassword } = user;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
          this.currentUserSubject.next(userWithoutPassword as Usuario);
        }
      }
    }
  }

  async registerUser(userData: {
    username: string;
    password: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    dni?: string;
    fechaNacimiento?: string;
    rol: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          return { success: false, error: 'Debe seleccionar una institución primero' };
        }

        const nuevoUsuario = {
          id: crypto.randomUUID(),
          username: userData.username,
          password: userData.password, // En producción debe estar hasheado
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          telefono: userData.telefono || null,
          dni: userData.dni || null,
          fecha_nacimiento: userData.fechaNacimiento || null,
          direccion: null,
          rol: userData.rol,
          avatar: null,
          institucion_id: currentInstitucion.id,
          fecha_registro: new Date().toISOString(),
          activo: true,
          ultimo_acceso: null
        };

        const { error } = await this.supabase.client
          .from('usuarios')
          .insert([nuevoUsuario]);

        if (error) {
          if (error.code === '23505') { // Violación de unique constraint
            if (error.message.includes('username')) {
              return { success: false, error: 'El nombre de usuario ya está en uso' };
            } else if (error.message.includes('email')) {
              return { success: false, error: 'El email ya está registrado' };
            }
          }
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error: any) {
        console.error('Error en registro:', error);
        return { success: false, error: error.message || 'Error inesperado al registrar usuario' };
      }
    } else {
      // Fallback a localStorage
      const usuarios = this.getUsuariosFromStorage();
      const nuevoUsuario: Usuario = {
        id: crypto.randomUUID(),
        username: userData.username,
        password: userData.password,
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        telefono: userData.telefono,
        dni: userData.dni,
        fechaNacimiento: userData.fechaNacimiento,
        rol: userData.rol as Usuario['rol'],
        fechaRegistro: new Date().toISOString(),
        activo: true
      };
      usuarios.push(nuevoUsuario);
      localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(usuarios));
      return { success: true };
    }
  }
}
