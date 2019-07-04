import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { NOT_FOUND } from 'http-status-codes';

import { MembersApi } from '../../data-providers/members.data-provider';
import {
  ICount,
  IMember,
  IMemberWithoutId,
} from '../../data-providers/models/models';
import { MessageService } from '../message-service/message.service';
import { IErrReport } from '../../config';

/**
 * This service provides functions to call all the api functions providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(
    private messageService: MessageService,
    private membersApi: MembersApi,
    private logger: NGXLogger,
  ) {
    this.logger.trace(MembersService.name + ': starting members.service');
  }

  /**
   * Gets members from the server.
   * @param
   * - term: Returns only those members that start with 'term'.
   * @returns
   * - An observable with an array of the members returned from the server.
   * - 404 is received from the server if there are no members in the stored team or if there are no members matching the supplied term.  In this case an empty array is returned.
   * @throws
   * - Throws an observable with an error if any response other than a successful response, or a Not Found/404, is received from the server.
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

        /* handle Not Found/404 - inform user and return an empty array */
        if (err.error && err.error.status === NOT_FOUND) {
          this.logger.trace(
            MembersService.name + ': Handling Not Found / 404 - not an error',
          );
          if (term) {
            this.log(`Did not find any members matching "${term}"`);
            return of([]);
          } else {
            this.log('There are no members to fetch');
            return of([]);
          }
        } else {
          /* rethrow anything other than a 404 */
          this.logger.trace(MembersService.name + ': Throwing the error on');
          /* inform user and mark as handled */
          err.isHandled = true;
          this.log('ERROR: Failed to get members from server');
          return throwError(err);
        }
      }),
    );
  }

  /**
   * Gets member by id.
   * @param
   * - id: Returns the member with that id.
   * @returns
   * - An observable containing a member object.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  getMember(id: number): Observable<IMember> {
    this.logger.trace(MembersService.name + ': getMember called');

    return this.membersApi.getMember(id).pipe(
      tap((_) => {
        this.log(`Fetched member with id = ${id}`);
      }),
      catchError((errReport: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* handle only HttpErrorResponse errors */
        if (errReport.error && errReport.error.name === 'HttpErrorResponse') {
          /* handle Not Found/404 */
          if (errReport.error && errReport.error.status === NOT_FOUND) {
            this.logger.trace(
              MembersService.name + ': Handling a Not Found / 404 error',
            );
            /* inform user that that member did not exist */
            this.log(`ERROR: Did not find member with id = ${id}`);

            /* otherwise inform user of general fail */
          } else {
            this.log('ERROR: Failed to get member from server');
          }
          /* mark as handled for errorHandler */
          errReport.isHandled = true;
        }

        /* rethrow all errors */
        this.logger.trace(MembersService.name + ': Throwing the error on');
        return throwError(errReport);
      }),
    );
  }

  /**
   * Add a new member to the team.
   * @param
   * - member: Member to be added (without an id field).
   * @returns
   * - An observable containing the added member.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  addMember(member: IMemberWithoutId): Observable<IMember> {
    this.logger.trace(MembersService.name + ': addMember called');

    return this.membersApi.addMember(member).pipe(
      tap((newMember: IMember) => {
        this.log(`Added member with id = ${newMember.id}`);
      }),

      catchError((err: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* inform user and set err corresponding flag */
        this.log('ERROR: Failed to add member to server');
        err.isHandled = true;

        /* rethrow all errors */
        this.logger.trace(MembersService.name + ': Throwing the error on');
        return throwError(err);
      }),
    );
  }

  /**
   * Delete a member from the team.
   * @param
   * - memberOrId: A member object, or the id of the member to be deleted.
   * @returns
   * - An observable containing the count of the members deleted (i.e. 1).
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  deleteMember(memberOrId: IMember | number): Observable<ICount> {
    this.logger.trace(MembersService.name + ': deleteMember called');

    const id = typeof memberOrId === 'number' ? memberOrId : memberOrId.id;

    return this.membersApi.deleteMember(id).pipe(
      tap((_) => {
        this.log(`Deleted member with id = ${id}`);
      }),
      catchError((errReport: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* handle Not Found/404 - inform user */
        if (errReport.error && errReport.error.status === NOT_FOUND) {
          this.logger.trace(
            MembersService.name + ': Handling a Not Found / 404 error',
          );
          this.log(`ERROR: Did not find member with id = ${id}`);
        } else {
          /* otherwise inform user of a general error */
          this.log('ERROR: Failed to delete member from server');
        }
        errReport.isHandled = true;

        /* rethrow all errors */
        this.logger.trace(MembersService.name + ': Throwing the error on');
        return throwError(errReport);
      }),
    );
  }

  /**
   * Update a member on the server.
   * @param
   * - memberOrId: A member object.
   * @returns
   * - An observable containing the updated member.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  updateMember(member: IMember): Observable<IMember> {
    this.logger.trace(MembersService.name + ': updateMember called');

    return this.membersApi.updateMember(member).pipe(
      tap((_) => {
        this.log(`Updated member with id = ${member.id}`);
      }),
      catchError((errReport: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* handle Not Found/404 - inform user */
        if (errReport.error && errReport.error.status === NOT_FOUND) {
          this.logger.trace(
            MembersService.name + ': Handling a Not Found / 404 error',
          );
          this.log(`ERROR: Did not find member with id = ${member.id}`);
        } else {
          /* otherwise inform user of a general error */
          this.log('ERROR: Failed to update member on server');
        }
        errReport.isHandled = true;

        /* rethrow all errors */
        this.logger.trace(MembersService.name + ': Throwing the error on');
        return throwError(errReport);
      }),
    );
  }

  /**
   * Displays a message on the web page message log.
   */
  private log(message: string): void {
    this.logger.trace(MembersService.name + ': Reporting: ' + message);
    this.messageService.add(`MembersService: ${message}`);
  }
}
