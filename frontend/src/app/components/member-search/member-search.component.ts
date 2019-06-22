import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/api-members.service';
import { config } from '../../config';

/**
 * This component supplies an input box that is used to find members on the server.  As the user enters text in the input box the component lists the members whose name starts with the entered text.  An interval is awaited after each keystroke before it requests a search from the server.
 */
@Component({
  selector: 'app-member-search',
  templateUrl: './member-search.component.html',
  styleUrls: ['./member-search.component.scss'],
})
export class MemberSearchComponent implements OnInit, OnDestroy {
  /* main title */
  header = 'Member Search';
  /* base route to get member detail */
  detail = config.routes.detail;
  /* member property to display in the list of found members */
  propertyToDisplay = 'name';
  /* members observable from search term */
  members$: Observable<IMember[]> | undefined;
  /* members stored locally from search term */
  members: IMember[] | undefined;
  /* search debounce time in ms */
  debounce = 300;

  /* subject observable to initiate search */
  private searchTerms$ = new Subject<string>();
  /* unsubscribe signal */
  private unsubscribeSignal$ = new Subject<void>();

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      MemberSearchComponent.name + ': Starting MemberSearchComponent',
    );
  }

  ngOnInit(): void {
    /**
     * Creates an observable of the members returned by the search term, subscribes and stores the found members.
     */
    this.searchTerms$
      .pipe(
        /* wait a set interval after each keystroke before considering the term */
        debounceTime(this.debounce),

        /* ignore new term if same as previous term */
        distinctUntilChanged(),

        /* get the memberService observable each time the term changes */
        switchMap(
          (term: string): Observable<IMember[]> => {
            return this.membersService.getMembers(term);
          },
        ),

        /* unsubscribe on ngDestroy */
        takeUntil(this.unsubscribeSignal$.asObservable()),
      )
      .subscribe((foundMembers) => {
        /* store returned members locally */
        this.members = foundMembers;
      });
  }

  /**
   * Pushes a search term into the searchTerms$ observable.
   */
  search(term: string): void {
    this.logger.trace(MemberSearchComponent.name + ': Calling search(term)');
    this.searchTerms$.next(term);
  }

  /**
   * Clears the input box and the list of displayed members.
   */
  clear(): void {
    this.logger.trace(MemberSearchComponent.name + ': Calling clear()');
    this.members = undefined;
  }

  /**
   * The member property to display for the listed found members is returned by this function.
   */
  showProperty(member: IMember): IMember {
    return member[this.propertyToDisplay];
  }

  trackByFn(_index: number, member: IMember): number | null {
    return member ? member.id : null;
  }

  ngOnDestroy(): void {
    this.unsubscribeSignal$.next();
    this.unsubscribeSignal$.unsubscribe();
  }
}
