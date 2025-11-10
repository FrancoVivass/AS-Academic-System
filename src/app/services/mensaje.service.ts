import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Mensaje, Chat } from '../models/mensaje.model';

@Injectable({
  providedIn: 'root'
})
export class MensajeService {
  private readonly STORAGE_KEY = 'gestion_academica_mensajes';
  private readonly CHATS_KEY = 'gestion_academica_chats';
  private mensajesSubject = new BehaviorSubject<Mensaje[]>(this.getMensajes());
  public mensajes$ = this.mensajesSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const mensajes = this.getMensajes();
    if (mensajes.length === 0) {
      // Datos de ejemplo se crearán cuando se use
    }
  }

  getMensajes(): Mensaje[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getMensajesByUsuario(usuarioId: string): Mensaje[] {
    return this.getMensajes().filter(m => 
      m.remitenteId === usuarioId || m.destinatarioId === usuarioId
    );
  }

  getMensajesNoLeidos(usuarioId: string): Mensaje[] {
    return this.getMensajes().filter(m => 
      m.destinatarioId === usuarioId && !m.leido
    );
  }

  addMensaje(mensaje: Mensaje): void {
    const mensajes = this.getMensajes();
    mensajes.push(mensaje);
    this.saveMensajes(mensajes);
  }

  marcarComoLeido(mensajeId: string): void {
    const mensajes = this.getMensajes();
    const mensaje = mensajes.find(m => m.id === mensajeId);
    if (mensaje) {
      mensaje.leido = true;
      this.saveMensajes(mensajes);
    }
  }

  private saveMensajes(mensajes: Mensaje[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mensajes));
    this.mensajesSubject.next(mensajes);
  }

  getChats(usuarioId: string): Chat[] {
    const stored = localStorage.getItem(this.CHATS_KEY);
    const chats: Chat[] = stored ? JSON.parse(stored) : [];
    return chats.filter(c => c.participantes.includes(usuarioId));
  }

  crearChat(chat: Chat): void {
    const chats = this.getChats(chat.participantes[0]);
    chats.push(chat);
    localStorage.setItem(this.CHATS_KEY, JSON.stringify([...this.getAllChats(), chat]));
  }

  private getAllChats(): Chat[] {
    const stored = localStorage.getItem(this.CHATS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}

