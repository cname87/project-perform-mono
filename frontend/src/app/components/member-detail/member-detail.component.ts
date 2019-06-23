import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/api-members.service';
import { first, multicast, refCount } from 'rxjs/operators';
import { Subject, of, Observable } from 'rxjs';

/**
 * This member shows detail on a member whose id is passed in via the url id parameter.
 */
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  /* member to display initialised with dummy value*/
  member$: Observable<IMember> = of({
    id: 0,
    name: '',
  });

  /* mode for input box */
  inputMode = 'edit';

  constructor(
    private route: ActivatedRoute,
    private membersService: MembersService,
    private location: Location,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      MemberDetailComponent.name + ': Starting MemberDetailComponent',
    );
  }

  ngOnInit(): void {
    this.member$ = this.getMember();
  }

  /**
   * Gets the member from the server based on the id supplied in the route and sets the local observable accordingly.
   */
  getMember(): Observable<IMember> {
    this.logger.trace(MemberDetailComponent.name + ': Calling getMember');
    /* get id of member to be displayed from the route */
    const id = +(this.route.snapshot.paramMap.get('id') as string);
    /* create a subject to multicast to elements on html page */
    const subject = new Subject<IMember>();
    return this.membersService.getMember(id).pipe(
      first(),
      multicast(subject),
      refCount(),
    );
  }

  goBack(): void {
    this.location.back();
  }

  /**
   * Updates the name property of the member previously retrieved.
   * Called by the input box when the user updates the input string and presses Enter (or clicks on the the Save icon).
   * Note: members$ completes when page displayed => cannot get from members$ so got from page instead.
   * @param name
   * name: The input box string is supplied as the name parameter.
   * id: The displayed member id is supplied as the member id.
   */
  save(name: string, id: string): void {
    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    this.membersService
      .updateMember({ id: +id, name })
      .pipe(first())
      .subscribe(() => {
        this.goBack();
      });
  }
}
