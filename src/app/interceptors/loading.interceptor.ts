import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Mostrar loading solo para peticiones que no sean de Supabase (ya que son muy rápidas)
    // O mostrar para todas si prefieres
    const shouldShowLoading = !req.url.includes('supabase.co') || req.url.includes('storage');
    
    if (shouldShowLoading) {
      this.loadingService.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (shouldShowLoading) {
          // Pequeño delay para que se vea el efecto
          setTimeout(() => {
            this.loadingService.hide();
          }, 300);
        }
      })
    );
  }
}

