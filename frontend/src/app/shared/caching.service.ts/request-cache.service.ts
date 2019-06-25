import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';

const maxAge = 300000; // ms

@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  private cache = new Map();
  private getReqId(req: HttpRequest<any>) {
    /* cache requests must match url + params */
    return req.urlWithParams + ':' + req.method;
  }

  constructor(private logger: NGXLogger) {
    this.logger.trace(
      RequestCacheService.name + ': Starting RequestCacheService',
    );
  }

  clearCache() {
    this.logger.trace(RequestCacheService.name + ': clearing cache');
    this.cache.clear();
  }

  get(req: HttpRequest<any>): HttpResponse<any> | undefined {
    const reqId = this.getReqId(req);
    const cached = this.cache.get(reqId);

    if (!cached) {
      return undefined;
    }

    return cached.response;
  }

  put(req: HttpRequest<any>, response: HttpResponse<any>): void {
    const reqId = this.getReqId(req);
    const entry = { response, lastRead: Date.now() };

    this.cache.set(reqId, entry);

    const expired = Date.now() - maxAge;
    this.cache.forEach((expiredEntry) => {
      if (expiredEntry.lastRead < expired) {
        this.cache.delete(expiredEntry.url);
      }
    });
  }
}
