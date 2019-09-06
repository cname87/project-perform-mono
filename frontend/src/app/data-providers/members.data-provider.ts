/**
 * Project Perform API V1
 * V1.x.x covers the API for one team
 *
 *
 * OpenAPI spec version: 1.0.0
 * Contact: cname@yahoo.com
 */

/* external dependencies */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

/* internal dependencies */
import { membersConfiguration } from './configuration';
import { CustomHttpUrlEncodingCodec } from './encoder';
import { ICount, IMember, IMemberWithoutId } from './models/models';
import { catchError, tap } from 'rxjs/operators';
export { ICount, IMember, IMemberWithoutId };

/**
 * This service handles all communication with the server. It implements all the function to create, get, update and delete members on the server.
 */
@Injectable({
  providedIn: 'root',
})
export class MembersDataProvider {
  /* local variables */
  private basePath = membersConfiguration.basePath;
  private membersPath = membersConfiguration.servicePath;
  private defaultHeaders = membersConfiguration.defaultHeaders;
  private withCredentials = membersConfiguration.withCredentials;

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      MembersDataProvider.name + ': Starting MembersDataProvider',
    );
  }

  /**
   * Adds a supplied member.
   * A member object without the id property must be supplied in the body.
   * @param: memberWithoutId: Member object but with no id property.
   * @returns An observable returning the member added.
   */

  public addMember(memberWithoutId: IMemberWithoutId): Observable<IMember> {
    this.logger.trace(MembersDataProvider.name + ': addMember called');

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

    this.logger.trace(
      MembersDataProvider.name +
        `: Sending POST request to: ${this.basePath}/${this.membersPath}`,
    );

    return this.httpClient
      .post<IMember>(`${this.basePath}/${this.membersPath}`, memberWithoutId, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(MembersDataProvider.name + ': Received response');
        }),
        catchError((errReport) => {
          this.logger.trace(MembersDataProvider.name + ': catchError called');
          /* rethrow all errors */
          this.logger.trace(
            MembersDataProvider.name + ': Throwing the error on',
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Gets all the members, or as determined by a query string.
   * @param name: An optional search string to limit the returned list.
   * All members with the name property starting with 'name' will be returned.
   * @returns An observable returning an array of the members retrieved.
   */
  public getMembers(name?: string): Observable<IMember[]> {
    this.logger.trace(MembersDataProvider.name + ': getMembers called');

    /* set up query parameter */
    let queryParameters = new HttpParams();
    if (name !== undefined && name !== null) {
      /* custom encoder handles '+' properly */
      const encoder = new CustomHttpUrlEncodingCodec();
      name = encoder.encodeValue(name);
      queryParameters = queryParameters.set('name', name);
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      MembersDataProvider.name +
        `: Sending GET request to: ${this.basePath}/${this.membersPath}`,
    );

    return this.httpClient
      .get<IMember[]>(`${this.basePath}/${this.membersPath}`, {
        params: queryParameters,
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(MembersDataProvider.name + ': Received response');
        }),
        catchError((errReport) => {
          this.logger.trace(MembersDataProvider.name + ': catchError called');
          /* rethrow all errors */
          this.logger.trace(
            MembersDataProvider.name + ': Throwing the error on',
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Get a specific member.
   * @param id: The value of the id property of the member.
   * @returns An observable returning the members retrieved.
   */
  public getMember(id: number): Observable<IMember> {
    this.logger.trace(MembersDataProvider.name + ': getMember called');

    if (id === null || id === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling getMember.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      MembersDataProvider.name +
        `: Sending GET request to: ${this.basePath}/${this.membersPath}/${id}`,
    );

    return this.httpClient
      .get<IMember>(
        `${this.basePath}/${this.membersPath}/${encodeURIComponent(
          String(id),
        )}`,
        {
          withCredentials: this.withCredentials,
          headers,
        },
      )
      .pipe(
        tap((_) => {
          this.logger.trace(MembersDataProvider.name + ': Received response');
        }),
        catchError((errReport) => {
          this.logger.trace(MembersDataProvider.name + ': catchError called');
          /* rethrow all errors */
          this.logger.trace(
            MembersDataProvider.name + ': Throwing the error on',
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Updates a member.
   * A member object is supplied which must have an id property.
   * The member with that id is updated.
   * @param member: Team member to be updated detail
   * @returns An observable returning the updated member.
   */
  public updateMember(member: IMember): Observable<IMember> {
    this.logger.trace(MembersDataProvider.name + ': updateMember called');

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

    this.logger.trace(
      MembersDataProvider.name +
        `: Sending PUT request to: ${this.basePath}/${this.membersPath}`,
    );

    return this.httpClient
      .put<IMember>(`${this.basePath}/${this.membersPath}`, member, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(MembersDataProvider.name + ': Received response');
        }),
        catchError((errReport) => {
          this.logger.trace(MembersDataProvider.name + ': catchError called');
          /* rethrow all errors */
          this.logger.trace(
            MembersDataProvider.name + ': Throwing the error on',
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Deletes a member.
   * @param id The ID of the team member to delete.
   * @returns An observable returning a count of the members deleted, (which should always be 1).
   */
  public deleteMember(id: number): Observable<ICount> {
    this.logger.trace(MembersDataProvider.name + ': deleteMember called');

    if (id === null || id === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling deleteMember.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      MembersDataProvider.name +
        `: Sending DELETE request to: ${this.basePath}/${this.membersPath}/${id}`,
    );

    return this.httpClient
      .delete<ICount>(
        `${this.basePath}/${this.membersPath}/${encodeURIComponent(
          String(id),
        )}`,
        {
          withCredentials: this.withCredentials,
          headers,
        },
      )
      .pipe(
        tap((_) => {
          this.logger.trace(MembersDataProvider.name + ': Received response');
        }),
        catchError((errReport) => {
          this.logger.trace(MembersDataProvider.name + ': catchError called');
          /* rethrow all errors */
          this.logger.trace(
            MembersDataProvider.name + ': Throwing the error on',
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Deletes all members.
   * @returns An observable returning a count of the members deleted.
   */
  public deleteMembers(): Observable<ICount> {
    this.logger.trace(MembersDataProvider.name + ': deleteMembers called');

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      MembersDataProvider.name +
        `: Sending DELETE request to: ${this.basePath}/${this.membersPath}`,
    );

    return this.httpClient
      .delete<ICount>(`${this.basePath}/${this.membersPath}`, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(MembersDataProvider.name + ': Received response');
        }),
        catchError((errReport) => {
          this.logger.trace(MembersDataProvider.name + ': catchError called');
          /* rethrow all errors */
          this.logger.trace(
            MembersDataProvider.name + ': Throwing the error on',
          );
          return throwError(errReport);
        }),
      );
  }
}
