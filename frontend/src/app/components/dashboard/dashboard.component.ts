import { Component, OnInit, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { MembersService } from '../../shared/members-service/members.service';
import { IMember } from '../../data-providers/members.data-provider';

/**
 * This component displays a dashboard showing key information on a number of members.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  /* array of members from server */
  members$: Observable<IMember[]> = of([]);
  private firstMemberOnDisplay = 1;
  private lastMemberOnDisplay = 4;

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      DashboardComponent.name + ': Starting DashboardComponent',
    );
  }

  ngOnInit(): void {
    this.members$ = this.getMembers();
  }

  /**
   * Gets the members from the server.
   */
  getMembers(): Observable<IMember[]> {
    this.logger.trace(DashboardComponent.name + ': Calling getMembers');

    let errorHandlerCalled = false;

    return this.membersService.getMembers().pipe(
      map((members) => {
        return members.slice(
          this.firstMemberOnDisplay - 1,
          this.lastMemberOnDisplay,
        );
      }),
      catchError((error: any) => {
        /* only call the error handler once per ngOnInit even though the returned observable is multicast to multiple html elements */
        if (!errorHandlerCalled) {
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        /* return dummy value */
        return of([]);
      }),
    );
  }

  trackByFn(_index: number, member: IMember) {
    return member ? member.id : null;
  }
}
