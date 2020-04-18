import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../auth.service/auth.service';
import { IErrReport } from '../../config';

/**
 * Intercepts a http request and adds an Authorization header containing a jwt token.
 * @throws Throws an error if the authentication service observable errors.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private logger: NGXLogger) {
    this.logger.trace(`${AuthInterceptor.name}: Starting Interceptor`);
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return this.auth.getTokenSilently$().pipe(
      mergeMap((token) => {
        this.logger.trace(`${AuthInterceptor.name}: Adding token to request`);
        const tokenReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next.handle(tokenReq);
      }),
      catchError((err: IErrReport) => {
        this.logger.trace(`${AuthService.name}: catchError called`);
        /* fail with warning */
        err.isHandled = false;
        return throwError(err);
      }),
    );
  }
}
