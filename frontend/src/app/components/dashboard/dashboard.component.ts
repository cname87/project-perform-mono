import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/api-members.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  members: IMember[] = [];
  propertyToDisplay = 'name';
  firstMemberOnDisplay = 1;
  lastMemberOnDisplay = 4;

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
  ) {}

  ngOnInit() {
    this.getMembers();
  }

  getMembers() {
    throw new Error('Test error');
    this.logger.trace(DashboardComponent.name + ': Calling getMembers');
    this.membersService.getMembers().subscribe((members) => {
      this.members = members.slice(
        this.firstMemberOnDisplay - 1,
        this.lastMemberOnDisplay,
      );
    });
  }

  showProperty(member: IMember) {
    return member[this.propertyToDisplay];
  }

  trackByFn(_index: number, member: IMember) {
    return member ? member.id : null;
  }
}
