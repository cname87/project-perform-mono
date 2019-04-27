import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { MessageService } from './message.service';
import { MembersApi } from './membersApi/membersApi';
import { Count, Member } from './membersApi/model/models';

@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(
    private messageService: MessageService,
    private membersApi: MembersApi,
  ) {}

  /** GET members from the server */
  getMembers(): Observable<Member[]> {
    return this.membersApi.getMembers().pipe(
      tap((_) => this.log('fetched members')),
      catchError(this.handleError('getMembers', [])),
    );
  }

  /** GET member by id. Return `undefined` when id not found */
  getMemberNo404(id: number): Observable<Member> {
    return this.membersApi.getMember(id).pipe(
      tap((m) => {
        const outcome = m ? `fetched` : `did not find`;
        this.log(`${outcome} member id=${id}`);
      }),
      catchError(this.handleError<Member>(`getMember id=${id}`)),
    );
  }

  /** GET member by id. Will 404 if id not found */
  getMember(id: number): Observable<Member> {
    return this.membersApi.getMember(id).pipe(
      tap((_) => this.log(`fetched member id=${id}`)),
      catchError(this.handleError<Member>(`getMember id=${id}`)),
    );
  }

  /* GET members whose name contains search term */
  searchMembers(term: string): Observable<Member[]> {
    if (!term.trim()) {
      // if not search term, return empty member array.
      return of([]);
    }
    return this.membersApi.getMembers(term).pipe(
      tap((_) => this.log(`found members matching "${term}"`)),
      catchError(this.handleError<Member[]>('searchMembers', [])),
    );
  }

  //////// Save methods //////////

  /** POST: add a new member to the server */
  addMember(member: Member): Observable<Member> {
    return this.membersApi.addMember(member).pipe(
      tap((newMember: Member) => {
        this.log(`added member with id=${newMember.id}`);
      }),
      catchError(this.handleError<Member>('addMember')),
    );
  }

  /** DELETE: delete the member from the server */
  deleteMember(member: Member | number): Observable<Count> {
    const id = typeof member === 'number' ? member : member.id;
    return this.membersApi.deleteMember(id).pipe(
      tap((_) => this.log(`deleted member id=${id}`)),
      catchError(this.handleError<Count>('deleteMember')),
    );
  }

  /** PUT: update the member on the server */
  updateMember(member: Member): Observable<Member> {
    return this.membersApi.updateMember(member).pipe(
      tap((_) => this.log(`updated member id=${member.id}`)),
      catchError(this.handleError<Member>('updateMember')),
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a MembersService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`MembersService: ${message}`);
  }
}
