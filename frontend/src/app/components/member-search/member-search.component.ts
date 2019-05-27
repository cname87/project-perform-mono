import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api-members/api-members.service';
import { config } from '../../config';

@Component({
  selector: 'app-member-search',
  templateUrl: './member-search.component.html',
  styleUrls: ['./member-search.component.scss'],
})
export class MemberSearchComponent implements OnInit {
  /* main title */
  title = 'Member Search';
  /* component routing elements */
  detail = config.routes.detail;
  /* detail to display */
  propertyToDisplay = 'name';
  /* local variables */
  members$: Observable<IMember[]> | undefined;
  private searchTerms = new Subject<string>();

  constructor(private membersService: MembersService) {}

  // Push a search term into the observable stream.
  search(term: string) {
    this.searchTerms.next(term);
  }

  ngOnInit() {
    this.members$ = this.searchTerms.pipe(
      // wait 300ms after each keystroke before considering the term
      debounceTime(300),

      // ignore new term if same as previous term
      distinctUntilChanged(),

      // switch to new search observable each time the term changes
      switchMap((term: string) => {
        return this.membersService.getMembers(term);
      }),
    );
  }

  showProperty(member: IMember) {
    return member[this.propertyToDisplay];
  }

  trackByFn(_index: number, member: IMember) {
    return member ? member.id : null;
  }
}
