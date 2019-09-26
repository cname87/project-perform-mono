import { Component, OnInit, ErrorHandler } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  publishReplay,
  refCount,
  catchError,
  tap,
} from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { IsLoadingService } from '@service-work/is-loading';

import { MembersService } from '../../shared/members-service/members.service';
import { IMember } from '../../data-providers/members.data-provider';
import { routes } from '../../config';

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
  detail = routes.detail;
  /* member property to display in the list of found members */
  propertyToDisplay = 'name';

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
    private isLoadingService: IsLoadingService,
  ) {
    this.logger.trace(
      MemberSearchComponent.name + ': Starting MemberSearchComponent',
    );
  }

  ngOnInit() {
    /* controls that errorHandler only called once */
    let errorHandlerCalled = false;

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
          const getMembers$ = this.membersService.getMembers(term);
          this.isLoadingService.add();
          return getMembers$;
        },
      ),
      tap(() => {
        this.isLoadingService.remove();
      }),
      publishReplay(1),
      refCount(),
      catchError((error: any) => {
        this.isLoadingService.remove();
        if (!errorHandlerCalled) {
          this.logger.trace(MemberSearchComponent.name + ': catchError called');
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        return of([]);
      }),
    );
  }

  /**
   * Pushes a search term into the searchTerms$ observable.
   */
  search(term: string): void {
    this.logger.trace(MemberSearchComponent.name + `: Calling search(${term})`);
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
