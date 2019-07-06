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
import { RequestCacheService } from '../caching.service.ts/request-cache.service.old';

/**
 * See error-handler.ts for the error handling strategy:
 * Http errors are first handled by http-error-interceptor which retries and carries out other common handling routines e.g. authorization token refresh.
 * The http error is then passed back to the service method for further handling
 */

@Injectable({ providedIn: 'root' })
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private logger: NGXLogger,
    private requestCache: RequestCacheService,
  ) {
    this.logger.trace(
      HttpErrorInterceptor.name + ': Starting HttpErrorInterceptor',
    );
  }

  /* retry parameters */
  private totalTries = 3;
  private retryDelay = 500; // retry delay in ms

  /**
   * This interceptor passes the request untouched.
   * It handles the response as follows:
   * - It passes an non-error untouched.
   * - It will resubscribe to the request if an error is received.
   * - It will retry up to a limit.
   * - If the request fails again it will then pass on the error with an error report, (to be picked up by the error handler).
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    this.logger.trace(HttpErrorInterceptor.name + ': intercept called');

    return next.handle(request).pipe(
      /* only an error is passed into retryWhen */
      retryWhen((errors) => {
        return errors.pipe(
          /* concat map keeps errors in order and makes sure they aren't executed in parallel */
          concatMap((e, i) => {
            const errorsReceived = i + 1; // index is zero-based
            this.logger.trace(
              HttpErrorInterceptor.name +
                `: Error ${errorsReceived} received on try ${errorsReceived} of ${this.totalTries} to ${request.url}`,
            );
            return iif(
              () => {
                /* test for which function to run */
                return errorsReceived === this.totalTries;
              },
              /* if true we throw the last error */
              throwError(e),
              /* issuing any non-error event trigger the retry */
              of('trigger').pipe(
                /* issue after a delay */
                delay(this.retryDelay),
              ),
            );
          }),
        );
      }),
      catchError((caughtError: HttpErrorResponse) => {
        this.logger.trace(HttpErrorInterceptor.name + ': catchError called');

        /* clear the cache */
        this.requestCache.clearCache();

        /* add an error type to identified errors  */
        const errReport: IErrReport = {
          error: caughtError, // pass on original error
          allocatedType: 'TBC', // add a http error type
        };

        if (caughtError.error instanceof ErrorEvent) {
          /* the caught error will be of type HttpErrorResponse and its error property will be an instance of ErrorEvent if the error is client-side e.g. a network error */
          this.logger.trace(
            HttpErrorInterceptor.name + ': Client-side or network error',
          );

          errReport.allocatedType = 'Http client-side';
        }

        if (caughtError.status) {
          /* if the caught error's error property is not of type ErrorEvent then the error is a server response e.g 500 error */
          this.logger.trace(
            HttpErrorInterceptor.name +
              ': Server returned an unsuccessful response code',
          );

          errReport.allocatedType = 'Http server-side';
        }

        this.logger.trace(
          HttpErrorInterceptor.name + ': Throwing error report on',
        );
        return throwError(errReport);
      }),
    );
  }
}
