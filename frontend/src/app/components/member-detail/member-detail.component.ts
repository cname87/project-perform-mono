import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/api-members.service';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  @Input() member: IMember;
  /* mode for input box */
  inputMode = 'edit';

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
    this.membersService.getMember(id).subscribe(
      (member) => {
        if (!member) {
          /* *** implement error handling and logging *** */
          console.error(
            'member-detail-component getMember error: no member received',
          );
          /* go back */
          this.goBack();
        }
        this.member = member;
      },
      (err) => {
        /* *** implement error handling and logging *** */
        console.error('member-detail-component getMember error: ' + err);
        /* go back */
        this.goBack();
      },
    );
  }

  goBack() {
    this.location.back();
  }

  save(name: string) {
    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    this.member.name = name;

    this.membersService.updateMember(this.member).subscribe(
      () => {
        this.goBack();
      },
      (err) => {
        /* *** implement error handling and logging *** */
        console.error('member-detail-component updateMember error: ' + err);
        /* go back */
        this.goBack();
      },
    );
  }
}
