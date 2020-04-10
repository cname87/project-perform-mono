import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpRequest,
  HttpResponse,
  HttpInterceptor,
  HttpHandler,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NGXLogger, NgxLoggerLevel } from 'ngx-logger';

import { RequestCacheService } from '../caching.service/request-cache.service';
import { environment } from '../../../environments/environment';

/**
 * This service sends the request to the cache service and returns the cache response if one is provided.  If the cache does not return a response it passes on the request and the then sends the request and response to the cache service for its use.
 */

@Injectable({ providedIn: 'root' })
export class CachingInterceptor implements HttpInterceptor {
  constructor(private cache: RequestCacheService, private logger: NGXLogger) {
    this.logger.trace(`${CachingInterceptor.name}: intercept called`);
  }

  /**
   * Sends the request to the cache service and, if it receives a response from a cached response then it returns that as a response.
   * Otherwise it passes the request to sendRequest.
   */
  intercept(request: HttpRequest<any>, next: HttpHandler) {
    this.logger.trace(`${CachingInterceptor.name}: intercept called`);

    /* check if there is for a cached response */
    const cachedResponse = this.cache.getCache(request);

    /* if e2e testing then change logger config to log trace notifications */
    let originalLogLevel = NgxLoggerLevel.TRACE;
    if (environment.e2eTesting) {
      originalLogLevel = this.logger.getConfigSnapshot().level;
      this.logger.updateConfig({ level: NgxLoggerLevel.TRACE });
    }

    if (cachedResponse) {
      this.logger.trace(`${CachingInterceptor.name}: reading from cache`);
    }

    /* if e2e testing reset logger level */
    if (environment.e2eTesting) {
      this.logger.updateConfig({ level: originalLogLevel });
    }

    return cachedResponse
      ? of(cachedResponse)
      : this.sendRequest(request, next, this.cache);
  }

  /**
   * Passes the request to 'next()'.
   * Also sends the request and the response to the cache service.
   */
  private sendRequest(
    request: HttpRequest<any>,
    next: HttpHandler,
    cache: RequestCacheService,
  ): Observable<HttpEvent<any>> {
    /* if e2e testing then change logger config to log trace notifications */
    let originalLogLevel = NgxLoggerLevel.TRACE;
    if (environment.e2eTesting) {
      originalLogLevel = this.logger.getConfigSnapshot().level;
      this.logger.updateConfig({ level: NgxLoggerLevel.TRACE });
    }
    this.logger.trace(`${CachingInterceptor.name}: reading from server`);
    /* if e2e testing reset logger level */
    if (environment.e2eTesting) {
      this.logger.updateConfig({ level: originalLogLevel });
    }
    return next.handle(request).pipe(
      tap((response) => {
        /* check event is http response as there may be other events */
        if (response instanceof HttpResponse) {
          cache.putCache(request, response);
        }
      }),
    );
  }
}
