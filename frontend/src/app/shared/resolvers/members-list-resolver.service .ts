import { Injectable, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, publishReplay, refCount } from 'rxjs/operators';

import { MembersService } from '../members-service/members.service';
import { IMember } from '../../data-providers/models/models';

@Injectable({
  providedIn: 'root',
})
export class MembersListResolverService implements Resolve<IMember[]> {
  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      `${MembersListResolverService.name}: Starting MembersListResolverService`,
    );
  }

  /**
   * Called before membersList is loaded and stores the object returned in route data.
   * @param _route Not used.
   * @param _state Not used.
   */
  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IMember[]> {
    this.logger.trace(`${MembersListResolverService.name}: Calling getMembers`);

    let errorHandlerCalled = false;
    const dummyMembers: IMember[] = [];

    /* create a subject to multicast to elements on html page */
    return this.membersService.getMembers().pipe(
      publishReplay(1),
      refCount(),
      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MembersListResolverService.name}: getMembers catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        /* return dummy member */
        return of(dummyMembers);
      }),
    );
  }
}
