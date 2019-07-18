import { Injectable, Inject } from '@angular/core';
import {
  HttpEvent,
  HttpRequest,
  HttpInterceptor,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

import { errorMember, errorTestUrls, E2E_TESTING } from '../../config';

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

    this.logger.trace(
      `${E2eTestInterceptor.name} + : isTesting is ${this.isTesting}`,
    );
    /* pass through if not in e2e test mode */
    if (!this.isTesting) {
      return next.handle(req);
    }

    this.logger.trace(
      `${E2eTestInterceptor.name} + : isTesting is ${this.isTesting}` +
        '\nEntering error test - you should be in e2e test mode ONLY',
    );

    /* specific urls will trigger a specific response */
    switch (`${req.method}:${req.urlWithParams}`) {
      case errorTestUrls.post:
      case errorTestUrls.put: {
        /* exit unless we're dealing with the errorMember */
        if (req.body.name !== errorMember.name) {
          return next.handle(req);
        }

        this.logger.trace(
          E2eTestInterceptor.name + ': throwing a simulated server error',
        );
        const httpError = new HttpErrorResponse({
          error: {
            message: 'Test server-side error',
          },
          status: 998,
          statusText: 'Test 998 error',
          url: req.urlWithParams,
        });
        return throwError(httpError);
      }

      case errorTestUrls.getOne: {
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
          url: req.urlWithParams,
        });
        return throwError(httpError);
      }

      case errorTestUrls.delete:
      case errorTestUrls.getAll: {
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
