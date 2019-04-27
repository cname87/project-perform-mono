import { Component, OnInit } from '@angular/core';
import { MembersApi, Member } from '../membersApi/membersApi';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  members: Member[] = [];

  constructor(private membersService: MembersApi) {}

  ngOnInit() {
    this.getMembers();
  }

  getMembers(): void {
    this.membersService
      .getMembers()
      .subscribe((members) => (this.members = members.slice(1, 5)));
  }
}
