import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/api-members.service';
import { first } from 'rxjs/operators';

/**
 * This member shows detail on a member whose id is passed in via the url id parameter.
 */
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  /* member to display initialised with dummy values*/
  member: IMember = {
    id: 0,
    name: '',
  };

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
    this.getMember();
  }

  /**
   * Gets the member from the server based on the id supplied in the route and sets the local variable accordingly.
   */
  getMember(): void {
    this.logger.trace(MemberDetailComponent.name + ': Calling getMember');
    const id = +(this.route.snapshot.paramMap.get('id') as string);
    this.membersService
      .getMember(id)
      .pipe(first())
      .subscribe((member: any) => {
        this.member = member;
      });
  }

  goBack(): void {
    this.location.back();
  }

  /**
   * Updates the name property of the member previously retrieved.
   * @param name
   * - Called by the input box when the user updates the input string and presses Enter (or clicks on the the Save icon) - the input string is supplied as the name parameter.
   */
  save(name: string): void {
    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    this.member.name = name;

    this.membersService
      .updateMember(this.member)
      .pipe(first())
      .subscribe(() => {
        this.goBack();
      });
  }
}
