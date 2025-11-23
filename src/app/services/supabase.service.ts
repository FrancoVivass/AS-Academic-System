import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Obtiene el cliente de Supabase
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Métodos de utilidad para trabajar con tablas
   */
  
  // Obtener todos los registros de una tabla
  async getAll<T>(table: string): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(table)
      .select('*');
    
    if (error) throw error;
    return data as T[];
  }

  // Obtener un registro por ID
  async getById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as T;
  }

  // Crear un nuevo registro
  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const { data: newData, error } = await this.supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return newData as T;
  }

  // Actualizar un registro
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const { data: updatedData, error } = await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData as T;
  }

  // Eliminar un registro
  async delete(table: string, id: string): Promise<void> {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Realizar consultas personalizadas
  async query<T>(table: string, query: string): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(table)
      .select('*');
    
    if (error) throw error;
    return data as T[];
  }
}

