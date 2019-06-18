import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, startWith } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { NOT_FOUND } from 'http-status-codes';

import { MembersApi } from '../../api/api-members.service';
import { ICount, IMember, IMemberWithoutId } from '../../api/model/models';
import { MessageService } from './message.service';
import { HttpErrorResponse } from '@angular/common/http';

interface IErrReport {
  error: HttpErrorResponse; // the passed-in error
  type: 'Http client-side' | 'Http server-side' | 'TBC';
  message: string;
  status?: number; // the status code of a server-side response e.g. 404
  body?: object; // the body of a server-side error response
  IsUserInformed?: boolean; // set true if user is informed
}

@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(
    private messageService: MessageService,
    private membersApi: MembersApi,
    private logger: NGXLogger,
  ) {}

  /**
   * Gets members from the server.
   * @param term: Returns only those members that start with 'term'.
   * @returns Returns 404 if there are no members in the stored team or if there are no members matching the supplied term.
   */
  getMembers(term?: string): Observable<IMember[]> {
    this.logger.trace(MembersService.name + ': getMembers called');

    if (typeof term === 'string' && term.trim() === '') {
      this.logger.trace(
        MembersService.name +
          ': Search term exists but is blank - returning empty members array',
      );
      return of([]);
    }
    return this.membersApi.getMembers(term).pipe(
      tap((_) => {
        if (term) {
          this.log(`Found members matching "${term}"`);
        } else {
          this.log('Fetched all members');
        }
      }),
      catchError((err: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');
        /* handle Not Found/404 - not an unexpected error - inform user and return an empty array */
        if (err.status === NOT_FOUND) {
          this.logger.trace(
            MembersService.name + ': Handling a Not Found / 404 error',
          );
          if (term) {
            this.log(`Did not find any members matching "${term}"`);
            return of([]);
          } else {
            this.log('There are no members to fetch');
            return of([]);
          }
        } else {
          /* rethrow anything other than a 404, but pass an empty array to the requester first */
          this.logger.trace(
            MembersService.name +
              ': Returning empty array and then throwing the error on',
          );
          /* inform user and set err flag */
          this.log('ERROR: Failed to get members from server');
          err.IsUserInformed = true;
          return throwError(err).pipe(startWith([]));
        }
      }),
    );
  }

  /** GET member by id */
  getMember(id: number): Observable<IMember> {
    return this.membersApi.getMember(id).pipe(
      tap((_) => {
        this.log(`Fetched member with id = ${id}`);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.log(`Did not find member with id = ${id}`);
          return this.handleError<IMember>('', { id: 0, name: '' })(err);
        }
        return this.handleError<IMember>('getMember', { id: 0, name: '' })(err);
      }),
    );
  }

  /** POST: add a new member to the server */
  addMember(member: IMemberWithoutId): Observable<IMember> {
    return this.membersApi.addMember(member).pipe(
      tap((newMember: IMember) => {
        this.log(`Added member with id = ${newMember.id}`);
      }),
      catchError(this.handleError<IMember>('addMember', { id: 0, name: '' })),
    );
  }

  /** DELETE: delete the member from the server */
  deleteMember(member: IMember | number): Observable<ICount> {
    const id = typeof member === 'number' ? member : member.id;
    return this.membersApi.deleteMember(id).pipe(
      tap((_) => {
        this.log(`Deleted member with id = ${id}`);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.log(`Did not find member with id = ${id}`);
          return this.handleError<ICount>('', { count: 0 })(err);
        }
        return this.handleError<ICount>('deleteMember', { count: 0 })(err);
      }),
    );
  }

  /** PUT: update the member on the server */
  updateMember(member: IMember): Observable<IMember> {
    return this.membersApi.updateMember(member).pipe(
      tap((_) => {
        this.log(`Updated member with id = ${member.id}`);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.log(`Did not find member with id = ${member.id}`);
          return this.handleError<IMember>('', { id: 0, name: '' })(err);
        }
        return this.handleError<IMember>('updateMember', { id: 0, name: '' })(
          err,
        );
      }),
    );
  }

  /**
   * Handle a Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed - an operation should only be passed in if the error is unexpected, e.g not 404.
   * @param result - optional value to return as the observable result.
   */
  private handleError<T>(operation?: string, result?: T) {
    this.logger.trace(MembersService.name + ': handleError called');

    return (error: HttpErrorResponse): Observable<T> => {
      this.logger.error(MembersService.name + ': Logging error:\n\n' + error);

      /* log only if a messgage is passed in i.e. the error was unexpected */
      if (operation) {
        this.log(`${operation} unexpected failure`);
      }

      /* let the app keep running by returning an empty result */
      this.logger.trace(MembersService.name + ': Keeping app running');
      return of(result as T);
    };
  }

  /**
   * Displays a message on the web page message log.
   */
  private log(message: string) {
    this.logger.trace(MembersService.name + ': Reporting: ' + message);
    this.messageService.add(`MembersService: ${message}`);
  }
}
