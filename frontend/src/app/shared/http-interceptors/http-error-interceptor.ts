import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, iif, of } from 'rxjs';
import { catchError, retryWhen, delay, concatMap } from 'rxjs/operators';
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
  private totalRetries = 3;
  private retryDelay = 500; // retry delay in ms

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
    this.logger.trace(HttpErrorInterceptor.name + ': intercept called');

    return next.handle(request).pipe(
      retryWhen((errors) => {
        return errors.pipe(
          /* concat map keeps errors in order and makes sure they aren't executed in parallel */
          concatMap((e, i) => {
            const errorsReceived = i + 1; // index is zero-based
            this.logger.trace(
              HttpErrorInterceptor.name +
                `: Error ${errorsReceived} received - retry ${errorsReceived} of ${
                  this.totalRetries
                } to ${request.url}`,
            );
            return iif(
              () => {
                /* test for which function to run */
                return errorsReceived === this.totalRetries;
              },
              /* if true we throw the last error */
              throwError(e),
              /* otherwise we trigger a retry after a delay */
              of('trigger').pipe(delay(this.retryDelay)),
            );
          }),
        );
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
