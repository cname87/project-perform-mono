import { Component, OnInit } from '@angular/core';
import { MembersService } from '../members.service';
import { Member } from '../membersApi/membersApi';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  members: Member[] = [];

  constructor(private membersService: MembersService) {}

  ngOnInit() {
    this.getMembers();
  }

  getMembers(): void {
    this.membersService
      .getMembers()
      .subscribe((members) => (this.members = members.slice(1, 5)));
  }
}
