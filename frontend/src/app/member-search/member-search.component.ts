import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { MembersService } from '../members.service';
import { IMember } from '../membersApi/membersApi';

@Component({
  selector: 'app-member-search',
  templateUrl: './member-search.component.html',
  styleUrls: ['./member-search.component.scss'],
})
export class MemberSearchComponent implements OnInit {
  title = 'Member Search';
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

  trackByFn(_index: number, member: IMember) {
    return member ? member.id : null;
  }
}
