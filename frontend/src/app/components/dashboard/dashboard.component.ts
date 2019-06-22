import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/api-members.service';

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
  propertyToDisplay = 'name';
  firstMemberOnDisplay = 1;
  lastMemberOnDisplay = 4;

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      DashboardComponent.name + ': Starting DashboardComponent',
    );
  }

  ngOnInit(): void {
    this.members$ = this.getMembers();
  }

  /**
   * Gets the members from the server by calling the membersService function.
   */
  getMembers(): Observable<IMember[]> {
    this.logger.trace(DashboardComponent.name + ': Calling getMembers');
    return this.membersService.getMembers().pipe(
      map((members) => {
        return members.slice(
          this.firstMemberOnDisplay - 1,
          this.lastMemberOnDisplay,
        );
      }),
    );
  }

  showProperty(member: IMember) {
    return member[this.propertyToDisplay];
  }

  trackByFn(_index: number, member: IMember) {
    return member ? member.id : null;
  }
}
