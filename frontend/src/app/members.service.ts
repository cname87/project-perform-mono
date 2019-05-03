import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { MembersApi } from './membersApi/membersApi';
import { ICount, IMember } from './membersApi/model/models';
import { MessageService } from './message.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(
    private messageService: MessageService,
    private membersApi: MembersApi,
  ) {}

  /** GET members from the server */
  getMembers(): Observable<IMember[]> {
    return this.membersApi.getMembers().pipe(
      tap((_) => {
        this.log('Fetched members');
      }),
      catchError(this.handleError('getMembers', [])),
    );
  }

  /** GET member by id */
  getMember(id: number): Observable<IMember> {
    return this.membersApi.getMember(id).pipe(
      tap((_) => {
        this.log(`Fetched member id=${id}`);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.log(`Did not find member id=${id}`);
        }
        return this.handleError<IMember>()(err);
      }),
    );
  }

  /* GET members whose name contains search term */
  searchMembers(term: string): Observable<IMember[]> {
    if (!term.trim()) {
      // if not search term, return empty member array.
      return of([]);
    }
    return this.membersApi.getMembers(term).pipe(
      tap((_) => {
        this.log(`Found members matching "${term}"`);
      }),
      catchError(this.handleError<IMember[]>('searchMembers', [])),
    );
  }

  /** POST: add a new member to the server */
  addMember(member: IMember): Observable<IMember> {
    return this.membersApi.addMember(member).pipe(
      tap((newMember: IMember) => {
        this.log(`Added member with id=${newMember.id}`);
      }),
      catchError(this.handleError<IMember>('addMember')),
    );
  }

  /** DELETE: delete the member from the server */
  deleteMember(member: IMember | number): Observable<ICount> {
    const id = typeof member === 'number' ? member : member.id;
    return this.membersApi.deleteMember(id).pipe(
      tap((_) => {
        this.log(`Deleted member id=${id}`);
      }),
      catchError(this.handleError<ICount>('deleteMember')),
    );
  }

  /** PUT: update the member on the server */
  updateMember(member: IMember): Observable<IMember> {
    return this.membersApi.updateMember(member).pipe(
      tap((_) => {
        this.log(`Updated member id=${member.id}`);
      }),
      catchError(this.handleError<IMember>('updateMember')),
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation?: string, result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      if (operation) {
        this.log(`${operation} Failed: ${error.message}`);
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
