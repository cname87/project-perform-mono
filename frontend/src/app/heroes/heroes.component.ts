import { Component, OnInit } from '@angular/core';

import { MembersService } from '../members.service';
import { Member } from '../membersApi/membersApi';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrls: ['./heroes.component.css'],
})
export class HeroesComponent implements OnInit {
  members: Member[];

  constructor(private membersService: MembersService) {}

  ngOnInit() {
    this.getMembers();
  }

  getMembers(): void {
    this.membersService.getMembers().subscribe((members) => {
      this.members = members;
    });
  }

  add(name: string): void {
    name = name.trim();
    if (!name) {
      return;
    }
    this.membersService.addMember({ name } as Member).subscribe((member) => {
      this.members.push(member);
    });
  }

  delete(member: Member): void {
    this.membersService.deleteMember(member.id).subscribe();
    this.members = this.members.filter((m) => m.id !== member.id);
  }
}
