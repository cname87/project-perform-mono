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
import { NGXLogger } from 'ngx-logger';

import { RequestCacheService } from '../caching.service.ts/request-cache.service';

@Injectable({ providedIn: 'root' })
export class CachingInterceptor implements HttpInterceptor {
  constructor(private cache: RequestCacheService, private logger: NGXLogger) {
    this.logger.trace(
      CachingInterceptor.name + ': Starting CachingInterceptor',
    );
  }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    this.logger.trace(CachingInterceptor.name + ': intercept called');
    /* only look to cache for GET requests */
    const cachedResponse =
      req.method === 'GET' ? this.cache.get(req) : undefined;

    if (cachedResponse) {
      this.logger.trace(CachingInterceptor.name + ': reading from cache');
    }

    return cachedResponse
      ? of(cachedResponse)
      : this.sendRequest(req, next, this.cache);
  }

  /**
   * Get server response observable by sending request to `next()`.
   * Will add the response to the cache.
   */
  sendRequest(
    req: HttpRequest<any>,
    next: HttpHandler,
    cache: RequestCacheService,
  ): Observable<HttpEvent<any>> {
    this.logger.trace(CachingInterceptor.name + ': reading from server');
    return next.handle(req).pipe(
      /* check event is http response as there may be other events */
      tap((event) => {
        /* if not a GET then clear the cache */
        if (event instanceof HttpResponse) {
          if (req.method === 'GET') {
            cache.put(req, event);
          } else {
            cache.clearCache();
          }
        }
      }),
    );
  }
}
