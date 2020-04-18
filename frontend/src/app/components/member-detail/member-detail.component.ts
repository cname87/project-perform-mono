import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { of, Observable } from 'rxjs';
import { IsLoadingService } from '@service-work/is-loading';

import { MembersService } from '../../shared/members-service/members.service';
import { IMember } from '../../data-providers/members.data-provider';

/**
 * This member shows detail on a member whose id is passed in via the url id parameter.
 */
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  /* member to display */
  member$!: Observable<IMember>;

  /* mode for input box */
  inputMode = 'edit';

  constructor(
    private route: ActivatedRoute,
    private membersService: MembersService,
    private location: Location,
    private logger: NGXLogger,
    private isLoadingService: IsLoadingService,
  ) {
    this.logger.trace(
      `${MemberDetailComponent.name}: Starting MemberDetailComponent`,
    );
  }

  ngOnInit() {
    /* get the data as supplied from the route resolver */
    this.route.data.subscribe((data: Data) => {
      this.member$ = of(data.member);
    });
  }

  goBack(): void {
    this.location.back();
  }

  /**
   * Updates the name property of the member previously retrieved.
   * Called by the input box when the user updates the input string and presses Enter (or clicks on the the Save icon).
   * Note: member$ completes when page displayed => cannot get from id from member$ so got from page instead.
   * @param name
   * name: The input box string is supplied as the name parameter.
   * id: The displayed member id is supplied as the member id.
   */
  save(name: string, id: string): void {
    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    /* set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      this.membersService.updateMember({ id: +id, name }).subscribe(() => {
        this.goBack();
      }),
    );
  }
}
