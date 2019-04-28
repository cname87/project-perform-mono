import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { MembersService } from '../members.service';
import { Member } from '../membersApi/membersApi';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css'],
})
export class MemberDetailComponent implements OnInit {
  @Input() member: Member;

  constructor(
    private route: ActivatedRoute,
    private membersService: MembersService,
    private location: Location,
  ) {
    this.member = {
      id: 0,
      name: '',
    };
  }

  ngOnInit(): void {
    this.getMember();
  }

  getMember(): void {
    const id = +(this.route.snapshot.paramMap.get('id') as string);
    this.membersService
      .getMember(id)
      .subscribe((member) => (this.member = member));
  }

  goBack(): void {
    this.location.back();
  }

  save(): void {
    this.membersService
      .updateMember(this.member)
      .subscribe(() => this.goBack());
  }
}
