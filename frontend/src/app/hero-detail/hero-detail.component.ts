import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { MembersService } from '../members.service';
import { Member } from '../membersApi/membersApi';

@Component({
  selector: 'app-hero-detail',
  templateUrl: './hero-detail.component.html',
  styleUrls: ['./hero-detail.component.css'],
})
export class HeroDetailComponent implements OnInit {
  @Input() member: Member;

  constructor(
    private route: ActivatedRoute,
    private membersService: MembersService,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.getMember();
  }

  getMember(): void {
    const id = +this.route.snapshot.paramMap.get('id');
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
