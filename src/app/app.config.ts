import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { LoadingInterceptor } from './interceptors/loading.interceptor';
import { CustomDateAdapter } from './adapters/custom-date-adapter';
import { CUSTOM_DATE_FORMATS } from './adapters/custom-date-formats';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    },
    {
      provide: DateAdapter,
      useClass: CustomDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: CUSTOM_DATE_FORMATS
    },
    importProvidersFrom(NgChartsModule)
  ]
};
