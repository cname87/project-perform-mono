/* "Barrel" of Http Interceptors */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { HttpErrorInterceptor } from './http-error.interceptor';
import { CachingInterceptor } from './caching.interceptor';
import { E2eTestInterceptor } from './e2e-test.interceptor';

/**
 * Http interceptor providers in order.
 */
export const httpInterceptorProviders = [
  /* request enters here */
  { provide: HTTP_INTERCEPTORS, useClass: CachingInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: E2eTestInterceptor, multi: true },
  /* request sent to server here */
];
