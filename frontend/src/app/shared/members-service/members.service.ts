import { Injectable, Inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { NOT_FOUND } from 'http-status-codes';
import { ToastrService } from 'ngx-toastr';

import { MembersDataProvider } from '../../data-providers/members.data-provider';
import {
  ICount,
  IMember,
  IMemberWithoutId,
} from '../../data-providers/models/models';
import { MessageService } from '../message-service/message.service';
import { IErrReport, errorSearchTerm, E2E_TESTING } from '../../config';

/**
 * This service provides functions to call all the api functions providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(
    @Inject(E2E_TESTING) private isTesting: boolean,
    private messageService: MessageService,
    private membersDataProvider: MembersDataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(MembersService.name + ': starting members.service');
  }

  /* common toastr message */
  private toastrMessage = 'A server access error has occurred';

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
    this.logger.trace(this.isTesting);
    // console.log(environment);

    /* e2e error test - only if e2e test and match to a specific term */
    if (this.isTesting && term === errorSearchTerm) {
      throw new Error('Test application error');
    }

    if (typeof term === 'string' && term.trim() === '') {
      this.logger.trace(
        MembersService.name +
          ': Search term exists but is blank - returning empty members array',
      );
      return of([]);
    }
    return this.membersDataProvider.getMembers(term).pipe(
      tap((members) => {
        if (members.length > 0) {
          if (term) {
            this.log(`Found members matching "${term}"`);
          } else {
            this.log('Fetched all members');
          }
        } else {
          if (term) {
            this.log(`Did not find any members matching "${term}"`);
          } else {
            this.log('There are no members to fetch');
          }
        }
      }),

      catchError((err: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* inform user and mark as handled */
        this.log('ERROR: Failed to get members from server');
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(MembersService.name + ': Throwing the error on');
        return throwError(err);
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

    return this.membersDataProvider.getMember(id).pipe(
      tap((_) => {
        this.log(`Fetched member with id = ${id}`);
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* inform user */
        if (errReport.error && errReport.error.status === NOT_FOUND) {
          /* 404: member did not exist */
          this.log(`ERROR: Did not find member with id = ${id}`);
        } else {
          /* otherwise a general fail */
          this.log('ERROR: Failed to get member from server');
        }
        this.toastr.error('ERROR!', this.toastrMessage);
        /* mark as handled */
        errReport.isHandled = true;

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

    return this.membersDataProvider.addMember(member).pipe(
      tap((newMember: IMember) => {
        this.log(`Added member with id = ${newMember.id}`);
      }),

      catchError((err: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* inform user and mark as handled */
        this.log('ERROR: Failed to add member to server');
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

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

    return this.membersDataProvider.deleteMember(id).pipe(
      tap((_) => {
        this.log(`Deleted member with id = ${id}`);
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* inform user */
        if (errReport.error && errReport.error.status === NOT_FOUND) {
          /* 404: member did not exist */
          this.log(`ERROR: Did not find member with id = ${id}`);
        } else {
          /* otherwise a general fail */
          this.log('ERROR: Failed to delete member from server');
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

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

    return this.membersDataProvider.updateMember(member).pipe(
      tap((_) => {
        this.log(`Updated member with id = ${member.id}`);
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(MembersService.name + ': catchError called');

        /* inform user */
        if (errReport.error && errReport.error.status === NOT_FOUND) {
          /* 404: member did not exist */
          this.log(`ERROR: Did not find member with id = ${member.id}`);
        } else {
          /* otherwise a general fail */
          this.log('ERROR: Failed to update member on the server');
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

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
