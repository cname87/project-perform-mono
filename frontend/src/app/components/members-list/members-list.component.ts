import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/services/members.service';
import { IMember, IMemberWithoutId } from '../../api/api-members.service';
import { first } from 'rxjs/operators';

/**
 * This component displays a ist of members.
 * - A delete button is provided on each member to allow that member be deleted.
 * - An input box is provided to allow a user enter a member name to cause a new member to be added to the server.
 */
@Component({
  selector: 'app-members',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.scss'],
})
export class MembersListComponent implements OnInit {
  /* members to list */
  members: IMember[] = [];
  /* mode for input box */
  inputMode = 'add';

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      MembersListComponent.name + ': Starting MembersListComponent',
    );
  }

  ngOnInit(): void {
    this.getMembers();
  }

  getMembers(): void {
    this.logger.trace(MembersListComponent.name + ': Calling getMembers');
    this.membersService
      .getMembers()
      .pipe(first())
      .subscribe((members) => {
        /* store returned members locally */
        this.members = members;
      });
  }

  add(name: string) {
    this.logger.trace(MembersListComponent.name + ': Calling addMember');
    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    /* trim the input text */
    name = name.trim();
    /* add the new member */
    const member: IMemberWithoutId = { name };
    this.membersService
      .addMember(member)
      .pipe(first())
      .subscribe((addedMember) => {
        this.members.push(addedMember);
      });
  }

  delete(member: IMember): void {
    this.logger.trace(MembersListComponent.name + ': Calling deleteMember');
    this.membersService
      .deleteMember(member.id)
      .pipe(first())
      .subscribe();
    /* remove deleted member from local list so the displayed list updates */
    this.members = this.members.filter((m) => m.id !== member.id);
  }

  trackByFn(_index: number, member: IMember): number | null {
    if (!member) {
      return null;
    }
    return member.id;
  }
}
