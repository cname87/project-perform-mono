import { Injectable, Inject, InjectionToken } from '@angular/core';
import {
  HttpEvent,
  HttpRequest,
  HttpInterceptor,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

import { testUrls } from '../../config';
export const E2E_TESTING = new InjectionToken<boolean>('e2e_testing');

@Injectable({ providedIn: 'root' })
export class E2eTestInterceptor implements HttpInterceptor {
  constructor(
    @Inject(E2E_TESTING) private isTesting: boolean,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      E2eTestInterceptor.name + ': Starting E2eTestInterceptor',
    );
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    this.logger.trace(E2eTestInterceptor.name + ': intercept called');

    /* pass through if not in e2e test mode */
    if (this.isTesting) {
      this.logger.trace(
        `${E2eTestInterceptor.name} + : isTesting is ${this.isTesting}`,
      );
    }
    // if (!this.isTesting) {
    if (true) {
      return next.handle(req);
    }

    this.logger.trace(
      E2eTestInterceptor.name +
        ': NOTE:  Entering error test - you should be in e2e test mode ONLY',
    );

    /* specific urls will trigger a specific response */
    switch (`${req.method}:${req.url}`) {
      case testUrls.httpErrorResponse: {
        this.logger.trace(
          E2eTestInterceptor.name + ': throwing a simulated server 500 error',
        );
        const httpError = new HttpErrorResponse({
          error: {
            message: 'Test server-side error',
          },
          status: 998,
          statusText: 'Test 998 error',
          url: testUrls.httpErrorResponse,
        });
        return throwError(httpError);
      }

      case testUrls.httpErrorEvent: {
        this.logger.trace(
          E2eTestInterceptor.name +
            ': throwing a simulated client-side or network ErrorEvent error',
        );

        const httpError = new HttpErrorResponse({
          error: new ErrorEvent('Test error-event error', {
            message: 'Test client-side error',
          }),
          status: 999,
          statusText: 'Test 999 error',
          url: testUrls.httpErrorEvent,
        });
        return throwError(httpError);
      }

      case testUrls.unexpectedError: {
        this.logger.trace(
          E2eTestInterceptor.name + ': throwing a simulated unexpected error',
        );

        throw new Error('Test unexpected error');
      }
    }

    /* pass through for all other urls */
    return next.handle(req);
  }
}
