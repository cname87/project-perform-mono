/* "Barrel" of Http Interceptors */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { HttpErrorInterceptor } from './http-error-interceptor';
import { CachingInterceptor } from './caching.interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: CachingInterceptor, multi: true },
];
