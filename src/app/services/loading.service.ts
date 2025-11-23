import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private loadingCount = 0;

  /**
   * Muestra el loading
   */
  show(): void {
    this.loadingCount++;
    if (this.loadingCount > 0) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Oculta el loading
   */
  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Resetea el contador de loading
   */
  reset(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Verifica si está cargando
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}

