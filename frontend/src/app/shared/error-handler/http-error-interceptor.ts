import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';

import { IErrReport } from '../../config';

/**
 * See error-handler.ts for the error handling strategy:
 * Http errors are first handled by http-error-interceptor which retries and carries out other common handling routines e.g. authorization token refresh.
 * The http error is then passed back to the service method for further handling
 */

@Injectable({ providedIn: 'root' })
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private logger: NGXLogger) {}

  /* retry parameters */
  totalTries = 2;
  tryNumber = 1;

  /**
   * This interceptor passes the request untouched.
   * It handles the response as follows:
   * - It will retry once if the request fails.
   * If the request fails again it will then catch and log the error before passing the error on.
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      retry(this.totalTries - 1),
      tap((data) => {
        /* log retry count */
        if (data.type === 0) {
          this.logger.trace(
            HttpErrorInterceptor.name +
              `: Try ${this.tryNumber} of ${this.totalTries}`,
          );
          this.tryNumber++;
          if (this.tryNumber > this.totalTries) {
            this.tryNumber = 1;
          }
        } else {
          /* valid data returned => reset count */
          this.tryNumber = 1;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.trace(HttpErrorInterceptor.name + ': catchError called');

        /* construct an error report to pass on */
        const errReport: IErrReport = {
          error,
          type: 'TBC',
          message: 'TBC',
        };
        if (error.error instanceof ErrorEvent) {
          this.logger.trace(
            HttpErrorInterceptor.name + ': Client-side or network error',
          );
          errReport.type = 'Http client-side';
          errReport.message = error.error.message;
        } else {
          this.logger.trace(
            HttpErrorInterceptor.name +
              ': Server returned an unsuccessful response code',
          );
          errReport.type = 'Http server-side';
          errReport.message = error.message;
          errReport.status = error.status;
          errReport.body = error.error;
        }

        this.logger.trace(
          HttpErrorInterceptor.name + ': Throwing error report on',
        );
        return throwError(errReport);
      }),
    );
  }
}
