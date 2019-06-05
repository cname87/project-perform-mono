import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from 'rxjs/operators';

import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/api-members.service';
import { config } from '../../config';
import { members } from '../../shared/mocks/mock-members';

@Component({
  selector: 'app-member-search',
  templateUrl: './member-search.component.html',
  styleUrls: ['./member-search.component.scss'],
})
export class MemberSearchComponent implements OnInit, OnDestroy {
  /* main title */
  header = 'Member Search';
  /* component routing elements */
  detail = config.routes.detail;
  /* detail to display */
  propertyToDisplay = 'name';
  /* members returned from search term (observable) */
  members$: Observable<IMember[]> | undefined;
  /* members returned from search term */
  members: IMember[] | undefined;
  /* subject observable in send search term to get members */
  private searchTerms$ = new Subject<string>();
  /* unsubscribe signal */
  private unsubscribeSignal$ = new Subject<void>();

  constructor(private membersService: MembersService) {}

  ngOnInit() {
    /* get an observable of the members returned by the search term following debounce */
    this.members$ = this.searchTerms$.pipe(
      /* wait 300ms after each keystroke before considering the term */
      debounceTime(300),

      /* ignore new term if same as previous term */
      distinctUntilChanged(),

      /* get the memberService observable each time the term changes */
      switchMap((term: string) => {
        return this.membersService.getMembers(term);
      }),

      /* unsubscribe on ngDestroy */
      takeUntil(this.unsubscribeSignal$.asObservable()),
    );

    /* get the actual members returned */
    this.members$
      .pipe(
        /* unsubscribe on ngDestroy */
        takeUntil(this.unsubscribeSignal$.asObservable()),
      )
      .subscribe((foundMembers) => {
        if (!members) {
        }
        this.members = foundMembers;
      });
  }

  ngOnDestroy() {
    this.unsubscribeSignal$.next();
    this.unsubscribeSignal$.unsubscribe();
  }

  /* push a search term into the observable stream */
  search(term: string) {
    this.searchTerms$.next(term);
  }

  /* return member property to display */
  showProperty(member: IMember) {
    return member[this.propertyToDisplay];
  }

  trackByFn(_index: number, member: IMember) {
    return member ? member.id : null;
  }
}
