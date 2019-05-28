import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { MembersApi } from '../../api/api-members.service';
import { ICount, IMember, IMemberWithoutId } from '../../api/model/models';
import { MessageService } from './message.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(
    private messageService: MessageService,
    private membersApi: MembersApi,
  ) {}

  /** GET members from the server */
  getMembers(term?: string): Observable<IMember[]> {
    if (typeof term === 'string' && term.trim() === '') {
      /* if search term exists but is blank then return an empty member array */
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
      catchError((err: HttpErrorResponse) => {
        /* handle 404 - not an unexpected error */
        if (err.status === 404) {
          if (term) {
            this.log(`Did not find any members matching "${term}"`);
            return this.handleError<IMember[]>('', [])(err);
          } else {
            this.log('There are no members to fetch');
            return this.handleError<IMember[]>('', [])(err);
          }
        }
        return this.handleError<IMember[]>('getMembers', [])(err);
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
   * @param operation - name of the operation that failed - an operation should only passed in if the error is unexpected, e.g not 404.
   * @param result - optional value to return as the observable result.
   */
  private handleError<T>(operation?: string, result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      /* log only if a messgage is passed in i.e. the error was unexpected */
      if (operation) {
        this.log(`${operation} unexpected failure`);
      }

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a MembersService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`MembersService: ${message}`);
  }
}
