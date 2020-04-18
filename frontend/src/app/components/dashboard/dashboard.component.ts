import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { ActivatedRoute, Data } from '@angular/router';
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

  constructor(private route: ActivatedRoute, private logger: NGXLogger) {
    this.logger.trace(
      `${DashboardComponent.name}: Starting DashboardComponent`,
    );
  }

  ngOnInit() {
    /* get the data as supplied from the route resolver */
    this.route.data.subscribe((data: Data) => {
      this.members$ = of(data.members).pipe(
        map((members) =>
          members.slice(
            this.firstMemberOnDisplay - 1,
            this.lastMemberOnDisplay,
          ),
        ),
      );
    });
  }

  trackByFn(_index: number, member: IMember) {
    return member ? member.id : null;
  }
}
