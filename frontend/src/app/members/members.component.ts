import { Component, OnInit } from '@angular/core';

import { MembersService } from '../members.service';
import { IMember, IMemberWithoutId } from '../membersApi/membersApi';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss'],
})
export class MembersComponent implements OnInit {
  members: IMember[];

  constructor(private membersService: MembersService) {
    this.members = [];
  }

  ngOnInit() {
    this.getMembers();
  }

  getMembers() {
    this.membersService.getMembers().subscribe((members) => {
      this.members = members;
    });
  }

  add(name: string) {
    name = name.trim();
    if (!name) {
      return;
    }
    const member: IMemberWithoutId = { name };
    this.membersService.addMember(member).subscribe((addedMember) => {
      this.members.push(addedMember);
    });
  }

  delete(member: IMember) {
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
