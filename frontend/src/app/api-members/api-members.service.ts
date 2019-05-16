/**
 * Project Perform API V1
 * V1.x.x cover the API for one team
 *
 * OpenAPI spec version: 1.0.0
 * Contact: cname@yahoo.com
 *
 */

/* external dependencies */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/* internal dependencies */
import { membersConfiguration } from './configuration';
import { CustomHttpUrlEncodingCodec } from './encoder';
import { ICount, IMember, IMemberWithoutId } from './model/models';
export { ICount, IMember, IMemberWithoutId };

@Injectable({
  providedIn: 'root',
})
export class MembersApi {
  /* local variables */
  protected basePath = membersConfiguration.basePath;
  protected membersPath = membersConfiguration.servicePath;
  protected defaultHeaders = membersConfiguration.defaultHeaders;
  protected withCredentials = membersConfiguration.withCredentials;

  constructor(protected httpClient: HttpClient) {}

  /**
   * Adds a supplied member.
   * A member object without the id property must be supplied in the body.
   * @param memberWithoutId Member detail but with no id property.
   */

  public addMember(memberWithoutId: IMemberWithoutId): Observable<IMember> {
    if (memberWithoutId === null || memberWithoutId === undefined) {
      throw new Error(
        'Required parameter memberWithoutId was null or undefined when calling addMember.',
      );
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    return this.httpClient.post<IMember>(
      `${this.basePath}/${this.membersPath}`,
      memberWithoutId,
      {
        withCredentials: this.withCredentials,
        headers,
      },
    );
  }

  /**
   * Returns all the members, or as determined by a query string.
   * @param name An optional search string to limit the returned list.
   * All members with the name property starting with 'name' will be returned.
   */
  public getMembers(name?: string): Observable<IMember[]> {
    let queryParameters = new HttpParams({
      encoder: new CustomHttpUrlEncodingCodec(),
    });
    if (name !== undefined && name !== null) {
      queryParameters = queryParameters.set('name', name);
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    return this.httpClient.get<IMember[]>(
      `${this.basePath}/${this.membersPath}`,
      {
        params: queryParameters,
        withCredentials: this.withCredentials,
        headers,
      },
    );
  }

  /**
   * Get a specific member.
   * @param id The value of the id property of the member.
   */
  public getMember(id: number): Observable<IMember> {
    if (id === null || id === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling getMember.',
      );
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    return this.httpClient.get<IMember>(
      `${this.basePath}/${this.membersPath}/${encodeURIComponent(String(id))}`,
      {
        withCredentials: this.withCredentials,
        headers,
      },
    );
  }

  /**
   * Updates a member.
   * A member object is supplied which must have an id property.
   * The member with that id is updated.
   * @param member Team member to be updated detail
   */
  public updateMember(member: IMember): Observable<IMember> {
    if (member === null || member === undefined) {
      throw new Error(
        'Required parameter member was null or undefined when calling updateMember.',
      );
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    return this.httpClient.put<IMember>(
      `${this.basePath}/${this.membersPath}`,
      member,
      {
        withCredentials: this.withCredentials,
        headers,
      },
    );
  }

  /**
   * Deletes a member.
   * @param id The ID of the team member.
   */
  public deleteMember(id: number): Observable<ICount> {
    if (id === null || id === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling deleteMember.',
      );
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    return this.httpClient.delete<ICount>(
      `${this.basePath}/${this.membersPath}/${encodeURIComponent(String(id))}`,
      {
        withCredentials: this.withCredentials,
        headers,
      },
    );
  }

  /**
   * Deletes all members.
   */
  public deleteMembers(): Observable<ICount> {
    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    return this.httpClient.delete<ICount>(`${this.basePath}/members`, {
      withCredentials: this.withCredentials,
      headers,
    });
  }
}
