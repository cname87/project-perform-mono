import { Injectable } from '@angular/core';
import { HttpResponse, HttpRequest } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { IMember } from '../../data-providers/models/models';

@Injectable({ providedIn: 'root' })
export class ResponseStore {
  /**
   * Holds the cached response.
   */
  private _response: HttpResponse<IMember[]> | undefined = undefined;

  constructor(private logger: NGXLogger) {
    this.logger.trace(ResponseStore.name + ': Starting ResponseStore');
  }

  /**
   * Gets the cached response.
   */
  get response(): HttpResponse<IMember[]> | undefined {
    return this._response;
  }

  /**
   * Sets the cached response from a get /members response.
   * It just copies the request to the cache.
   * @param getAllResponse
   * - The uncached response from an earlier get /members request.
   */
  setGetAll(getAllResponse: HttpResponse<[IMember]>) {
    this._response = getAllResponse;
  }

  /**
   * Sets the cached response from a post (add) /members request.
   * @param postOneResponse
   * - The uncached response from an earlier post /members request.
   */
  setPostOne(postOneResponse: HttpResponse<IMember>) {
    if (this._response && this._response.body && postOneResponse.body) {
      /* get the member to add from the request body */
      const addedMember: IMember = postOneResponse.body;
      /* get the current members array from the cached getMembers response */
      const cachedBody: IMember[] = this._response.body;
      /* create the new cached body by adding the member */
      cachedBody.push(addedMember);
      /* clone the cached response replacing the body */
      const newCachedResponse = this._response.clone({
        body: cachedBody,
      });
      /* set the cached response */
      this._response = newCachedResponse;
    } else {
      /* set to undefined if cached response or body not present */
      this._response = undefined;
    }
  }

  /**
   * Sets the cached response from a put (update) /members request.
   * @param putOneResponse
   * - The uncached response from an earlier put /members request.
   */
  setPutOne(putOneResponse: HttpResponse<IMember>) {
    if (this._response && this._response.body && putOneResponse.body) {
      /* get the member to update from the request body */
      const updatedMember: IMember = putOneResponse.body;
      /* get the current members array from the cached getMembers response */
      const cachedBody: IMember[] = this._response.body;
      /* get the index of the member to update */
      const index = cachedBody.findIndex((m) => m.id === updatedMember.id);
      /* exit id updated member if not found */
      if (index === -1) {
        this._response = undefined;
        return;
      }
      /* update the member (without changing its position) */
      cachedBody[index] = updatedMember;
      /* clone the cached response replacing the body */
      const newCachedResponse = this._response.clone({
        body: cachedBody,
      });
      /* set the cached response */
      this._response = newCachedResponse;
    } else {
      /* set to undefined if cached response or body not present */
      this._response = undefined;
    }
  }

  /**
   * Sets the cached response from a delete members/id request.
   * @param deleteRequest
   * - The uncached response from an earlier delete members/id request.
   */
  setDeleteOne(deleteRequest: HttpRequest<IMember>) {
    if (this._response && this._response.body) {
      /* get the id of the member to delete from the request url */
      const n = deleteRequest.url.lastIndexOf('/');
      const deletedMemberId = +deleteRequest.url.substring(
        n + 1,
        deleteRequest.url.length,
      );
      /* get the current members array from the cached getMembers response */
      let cachedBody: IMember[] = this._response.body;
      /* create the new cached body by deleting the member */
      cachedBody = cachedBody.filter((m) => m.id !== deletedMemberId);
      /* clone the cached response replacing the body */
      const newCachedResponse = this._response.clone({
        body: cachedBody,
      });
      /* set the cached response */
      this._response = newCachedResponse;
    } else {
      /* set to undefined if cached response or body not present */
      this._response = undefined;
    }
  }

  /**
   * Sets the cached response from a delete (all) /members response.
   * @param deleteAllResponse
   * - The uncached response from an earlier delete /members request.
   */
  setDeleteAll() {
    if (this._response && this._response.body) {
      /* get the current members array from the cached getMembers response */
      let cachedBody: IMember[] = this._response.body;
      /* delete the member list*/
      cachedBody = [];
      /* clone the cached response replacing the body */
      const newCachedResponse = this._response.clone({
        body: cachedBody,
      });
      /* set the cached response */
      this._response = newCachedResponse;
    } else {
      /* set to undefined if cached response or body not present */
      this._response = undefined;
    }
  }
  /**
   * Clears the cache by setting the cached response to undefined.
   */
  clearCache(): void {
    this.logger.trace(ResponseStore.name + ': clearing cache');
    this._response = undefined;
  }
}
