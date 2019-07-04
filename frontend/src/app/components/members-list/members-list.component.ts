import { Component, OnInit, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { MembersService } from '../../shared/members-service/members.service';
import {
  IMember,
  IMemberWithoutId,
} from '../../data-providers/members.data-provider';
import { publishReplay, refCount, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

/**
 * This component displays a list of members.
 * - A delete button is provided on each member to allow that member be deleted.
 * - An input box is provided to allow a user enter a member name to cause a new member to be added to the server.
 */
@Component({
  selector: 'app-members',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.scss'],
})
export class MembersListComponent implements OnInit {
  /* members to list */
  members: IMember[] = [];
  /* observable of array of members returned from search */
  members$: Observable<IMember[]> = of([]);
  /* mode for input box */
  inputMode = 'add';
  /* controls that errorHandler only called once */
  private errorHandlerCalled = false;

  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      MembersListComponent.name + ': Starting MembersListComponent',
    );
  }

  ngOnInit(): void {
    this.getMembers();
  }

  getMembers(): void {
    this.logger.trace(MembersListComponent.name + ': Calling getMembers');

    this.members$ = this.membersService.getMembers().pipe(
      /* using publish as share will resubscribe for each html call in case of unexpected error causing observable to complete */
      publishReplay(1),
      refCount(),
      catchError((error: any) => {
        /* only call the error handler once per ngOnInit even though the returned observable might be multicast to multiple html elements */
        if (!this.errorHandlerCalled) {
          this.errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        /* return empty array of members to all html elements */
        return of([]);
      }),
    );
  }

  add(name: string) {
    this.logger.trace(MembersListComponent.name + ': Calling addMember');

    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    /* trim the input text */
    name = name.trim();
    /* add the new member */
    const member: IMemberWithoutId = { name };

    this.membersService.addMember(member).subscribe((_addedMember) => {
      this.getMembers();
      /* allow errors go to errorHandler */
      /* httpclient observable => unsubscribe not necessary */
    });
  }

  delete(member: IMember): void {
    this.logger.trace(MembersListComponent.name + ': Calling deleteMember');
    this.membersService.deleteMember(member.id).subscribe((_count) => {
      this.getMembers();
      /* allow errors go to errorHandler */
      /* httpclient observable => unsubscribe not necessary */
    });
  }

  trackByFn(_index: number, member: IMember): number | null {
    if (!member) {
      return null;
    }
    return member.id;
  }
}
