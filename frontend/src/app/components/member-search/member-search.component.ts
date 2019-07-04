import { Component, OnInit, ErrorHandler } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  publishReplay,
  refCount,
  catchError,
} from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/members-service/members.service';
import { IMember } from '../../data-providers/members.data-provider';
import { config } from '../../config';

/**
 * This component supplies an input box that is used to find members on the server.  As the user enters text in the input box the component lists the members whose name starts with the entered text.  An interval is awaited after each keystroke before it requests a search from the server.
 */
@Component({
  selector: 'app-member-search',
  templateUrl: './member-search.component.html',
  styleUrls: ['./member-search.component.scss'],
})
export class MemberSearchComponent implements OnInit {
  /* main title */
  header = 'Member Search';
  /* initialises search hint */
  isStart = true;
  /* observable of array of members returned from search */
  members$: Observable<IMember[]> = of([]);
  /* subject observable to initiate search */
  private searchTerms$ = new Subject<string>();
  /* search debounce time in ms */
  private debounce = 300;
  /* base route to get member detail */
  detail = config.routes.detail;
  /* member property to display in the list of found members */
  propertyToDisplay = 'name';
  /* controls that errorHandler only called once */
  private errorHandlerCalled = false;

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      MemberSearchComponent.name + ': Starting MemberSearchComponent',
    );
  }

  ngOnInit(): void {
    /**
     * Creates an observable of the members returned by the search term, subscribes and stores the found members.
     */
    this.members$ = this.searchTerms$.pipe(
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
      /* using publish as share will resubscribe for each html call in case of unexpected error causing observable to complete (and I don't need to resubscribe on this page) */
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        /* only call the error handler once per ngOnInit even though the returned observable is multicast to multiple html elements */
        if (!this.errorHandlerCalled) {
          this.errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        /* return empty array of members to all html elements */
        return of([]);
      }),
    );
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
    /* getMembers('') returns an empty array without querying the backend */
    this.searchTerms$.next('');
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
}
