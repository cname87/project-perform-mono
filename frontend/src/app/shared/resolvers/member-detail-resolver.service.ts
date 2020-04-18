import { Injectable, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { publishReplay, refCount, catchError } from 'rxjs/operators';

import { MembersService } from '../members-service/members.service';
import { IMember } from '../../data-providers/models/models';

@Injectable({
  providedIn: 'root',
})
export class MemberDetailResolverService implements Resolve<IMember> {
  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      `${MemberDetailResolverService.name}: Starting MemberDetailResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IMember> {
    this.logger.trace(`${MemberDetailResolverService.name}: Calling getMember`);

    /* get id of member to be displayed from the route */
    const id = +(route.paramMap.get('id') || '0');

    let errorHandlerCalled = false;
    const dummyMember = {
      id: 0,
      name: '',
    };

    /* create a subject to multicast to elements on html page */
    return this.membersService.getMember(id).pipe(
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MemberDetailResolverService.name}: catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        /* return dummy member */
        return of(dummyMember);
      }),
    );
  }
}
