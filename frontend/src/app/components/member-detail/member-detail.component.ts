import { Component, OnInit, ErrorHandler } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/members-service/members.service';
import { IMember } from '../../api/api-members.service';
import { first, catchError, refCount, publishReplay } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

/**
 * This member shows detail on a member whose id is passed in via the url id parameter.
 */
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  /* member to display initialised with dummy value*/
  private dummyMember = {
    id: 0,
    name: '',
  };
  member$: Observable<IMember> = of(this.dummyMember);

  /* capture this for callbacks */
  _this = this;

  /* mode for input box */
  inputMode = 'edit';

  constructor(
    private route: ActivatedRoute,
    private membersService: MembersService,
    private location: Location,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      MemberDetailComponent.name + ': Starting MemberDetailComponent',
    );
  }

  ngOnInit(): void {
    this.member$ = this.getMember();
  }

  /**
   * Gets the member from the server based on the id supplied in the route and sets the local observable accordingly.
   */
  getMember(): Observable<IMember> {
    this.logger.trace(MemberDetailComponent.name + ': Calling getMember');

    /* get id of member to be displayed from the route */
    const id = +(this.route.snapshot.paramMap.get('id') as string);

    let errorHandlerCalled = false;
    const _this = this._this;

    /* create a subject to multicast to elements on html page */
    return this.membersService.getMember(id).pipe(
      /* multicast */
      /* using publish as share will resubscribe for each html call in case of unexpected error causing observable to complete (and I don't need to resubscribe on this page) */
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        /* only call the error handler once per ngOnInit even though the returned observable is multicast to multiple html elements */
        if (!errorHandlerCalled) {
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        /* return dummy value to all html elements */
        return of(_this.dummyMember);
      }),
    );
  }

  goBack(): void {
    this.location.back();
  }

  /**
   * Updates the name property of the member previously retrieved.
   * Called by the input box when the user updates the input string and presses Enter (or clicks on the the Save icon).
   * Note: members$ completes when page displayed => cannot get from members$ so got from page instead.
   * @param name
   * name: The input box string is supplied as the name parameter.
   * id: The displayed member id is supplied as the member id.
   */
  save(name: string, id: string): void {
    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    this.membersService
      .updateMember({ id: +id, name })
      .pipe(first())
      .subscribe(() => {
        this.goBack();
      });
  }
}
