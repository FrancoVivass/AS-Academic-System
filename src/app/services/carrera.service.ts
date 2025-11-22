import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Carrera, Equivalencia, PlanEstudio } from '../models/carrera.model';

@Injectable({
  providedIn: 'root'
})
export class CarreraService {
  private readonly STORAGE_KEY = 'gestion_academica_carreras';
  private readonly EQUIVALENCIAS_KEY = 'gestion_academica_equivalencias';
  private readonly PLANES_KEY = 'gestion_academica_planes_estudio';
  private carrerasSubject = new BehaviorSubject<Carrera[]>(this.getCarreras());
  public carreras$ = this.carrerasSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const carreras = this.getCarreras();
    if (carreras.length === 0) {
      // Las carreras se crearán desde el admin
    }
  }

  getCarreras(): Carrera[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getCarreraById(id: string): Carrera | undefined {
    return this.getCarreras().find(c => c.id === id);
  }

  addCarrera(carrera: Carrera): void {
    const carreras = this.getCarreras();
    carreras.push(carrera);
    this.saveCarreras(carreras);
  }

  updateCarrera(carrera: Carrera): void {
    const carreras = this.getCarreras();
    const index = carreras.findIndex(c => c.id === carrera.id);
    if (index !== -1) {
      carreras[index] = carrera;
      this.saveCarreras(carreras);
    }
  }

  deleteCarrera(id: string): void {
    const carreras = this.getCarreras().filter(c => c.id !== id);
    this.saveCarreras(carreras);
  }

  private saveCarreras(carreras: Carrera[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(carreras));
    this.carrerasSubject.next(carreras);
  }

  // Equivalencias
  getEquivalencias(): Equivalencia[] {
    const stored = localStorage.getItem(this.EQUIVALENCIAS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getEquivalenciasByCarrera(carreraId: string): Equivalencia[] {
    return this.getEquivalencias().filter(
      e => e.carreraOrigenId === carreraId || e.carreraDestinoId === carreraId
    );
  }

  addEquivalencia(equivalencia: Equivalencia): void {
    const equivalencias = this.getEquivalencias();
    equivalencias.push(equivalencia);
    localStorage.setItem(this.EQUIVALENCIAS_KEY, JSON.stringify(equivalencias));
  }

  aprobarEquivalencia(id: string, aprobadaPor: string): void {
    const equivalencias = this.getEquivalencias();
    const equivalencia = equivalencias.find(e => e.id === id);
    if (equivalencia) {
      equivalencia.estado = 'aprobada';
      equivalencia.aprobadaPor = aprobadaPor;
      equivalencia.fechaAprobacion = new Date().toISOString();
      localStorage.setItem(this.EQUIVALENCIAS_KEY, JSON.stringify(equivalencias));
    }
  }

  // Planes de Estudio
  getPlanesEstudio(): PlanEstudio[] {
    const stored = localStorage.getItem(this.PLANES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getPlanEstudioByCarrera(carreraId: string): PlanEstudio[] {
    return this.getPlanesEstudio().filter(p => p.carreraId === carreraId);
  }

  addPlanEstudio(plan: PlanEstudio): void {
    const planes = this.getPlanesEstudio();
    planes.push(plan);
    localStorage.setItem(this.PLANES_KEY, JSON.stringify(planes));
  }
}

