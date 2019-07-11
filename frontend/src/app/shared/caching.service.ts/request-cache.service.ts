import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { OK, CREATED } from 'http-status-codes';

// import { maxAge } from '../../config';
import { membersConfiguration } from '../../data-providers/configuration';
import { GetMembersCache } from './get-members-cache.service';

@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  private baseUrl =
    membersConfiguration.basePath + '/' + membersConfiguration.servicePath;

  constructor(private cache: GetMembersCache, private logger: NGXLogger) {
    this.logger.trace(
      RequestCacheService.name + ': Starting RequestCacheService',
    );
  }

  public clearCache(): void {
    this.logger.trace(RequestCacheService.name + ': clearing cache');
    this.cache.clearCache();
  }

  /**
   * Called by a http interceptor asking for a cached http response to a http request.
   * @param request: The http interceptor sends in the request for which a cached response is required.
   * @returns
   * - Returns a cached http response if it has one.
   * - Returns undefined if there is no cached response.
   */
  public getCache(request: HttpRequest<any>): HttpResponse<any> | undefined {
    this.logger.trace(RequestCacheService.name + ': getting cache');

    /* return cache for /members, i.e. get all members */
    if (request.method === 'GET' && request.urlWithParams === this.baseUrl) {
      return this.cache.response;
    } else {
      /* otherwise return that the cache is empty */
      return undefined;
    }
  }

  /**
   * Called by a http interceptor sending in a http request and its external response in order for the cache service to update the cache appropriately.
   * @param request, response
   * - The http request/response pair.
   * @returns void
   */
  public putCache(
    request: HttpRequest<any>,
    response: HttpResponse<any>,
  ): void {
    this.logger.trace(RequestCacheService.name + ': putting cache');

    /* clear cache if anything other than a 200 or 201 response */
    if (response.status !== OK && response.status !== CREATED) {
      this.clearCache();
      return;
    }

    /* decide action based on the request method & url */
    switch (request.method) {
      case 'GET': {
        /* set cache, i.e.store  get all members */
        if (request.urlWithParams === this.baseUrl) {
          this.cache.setGetAll(response);
        }
        /* don't change cache for any other GET */
        break;
      }

      case 'POST': {
        /* set cache, ie. add a member */
        if (request.urlWithParams === this.baseUrl) {
          this.cache.setPostOne(response);
        } else {
          this.clearCache();
        }
        break;
      }

      case 'PUT': {
        /* set cache, ie. update a member */
        if (request.urlWithParams === this.baseUrl) {
          this.cache.setPutOne(response);
        } else {
          this.clearCache();
        }
        break;
      }

      case 'DELETE': {
        const id = +request.urlWithParams.slice(this.baseUrl.length + 1);
        /* set cache, ie. delete one or all */
        if (request.urlWithParams === this.baseUrl) {
          /* if no /id parameter */
          this.cache.setDeleteAll();
        } else if (id && !isNaN(id)) {
          /* if id != 0 and is a number */
          this.cache.setDeleteOne(request);
        } else {
          this.clearCache();
        }
        break;
      }
      /* all other request types */
      default: {
        /* otherwise clear the cache */
        this.clearCache();
        break;
      }
    }
  }
}
