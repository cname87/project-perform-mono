import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { MembersService } from '../members.service';
import { IMember } from '../membersApi/membersApi';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  @Input() member: IMember;

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

  ngOnInit() {
    this.getMember();
  }

  getMember() {
    const id = +(this.route.snapshot.paramMap.get('id') as string);
    this.membersService.getMember(id).subscribe((member) => {
      this.member = member;
    });
  }

  goBack() {
    this.location.back();
  }

  save() {
    this.membersService.updateMember(this.member).subscribe(() => {
      this.goBack();
    });
  }
}
