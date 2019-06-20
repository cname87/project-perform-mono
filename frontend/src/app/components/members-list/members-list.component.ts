import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/services/members.service';
import { IMember, IMemberWithoutId } from '../../api/api-members.service';

@Component({
  selector: 'app-members',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.scss'],
})
export class MembersListComponent implements OnInit {
  members: IMember[];
  /* mode for input box */
  inputMode = 'add';

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
  ) {
    this.members = [];
  }

  ngOnInit() {
    this.getMembers();
  }

  getMembers() {
    this.logger.trace(MembersListComponent.name + ': Calling getMembers');
    this.membersService.getMembers().subscribe((members) => {
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
    this.membersService.addMember(member).subscribe((addedMember) => {
      this.members.push(addedMember);
    });
  }

  delete(member: IMember) {
    this.logger.trace(MembersListComponent.name + ': Calling deleteMember');
    this.membersService.deleteMember(member.id).subscribe();
    this.members = this.members.filter((m) => m.id !== member.id);
  }

  trackByFn(_index: number, member: IMember) {
    if (!member) {
      return null;
    }
    return member.id;
  }
}
