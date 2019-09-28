import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { MembersListResolverService } from './members-list-resolver.service ';
import { AppModule } from '../../app.module';
import { asyncError, asyncData } from '../test-helpers';
import { members } from '../mocks/mock-members';
import { MembersService } from '../members-service/members.service';

interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
}
interface IErrorHandlerSpy {
  handleError: jasmine.Spy;
}
describe('MembersListResolverService', () => {
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    const membersServiceSpy = jasmine.createSpyObj('membersService', [
      'getMembers',
    ]);
    const errorHandlerSpy = jasmine.createSpyObj('errorHandler', [
      'handleError',
    ]);
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: MembersService, useValue: membersServiceSpy },
        { provide: NGXLogger, useValue: loggerSpy },
        { provide: ErrorHandler, useValue: errorHandlerSpy },
        MembersListResolverService,
      ],
    }).compileComponents();
  }

  function createSpies(
    memberServiceSpy: IMembersServiceSpy,
    errorHandlerSpy: IErrorHandlerSpy,
    isError = false,
  ) {
    const getMembersSpy = memberServiceSpy.getMembers.and.callFake(
      /* returns the mock members array unless an input flag parameter is set in which case an error is thrown. */
      () => {
        return isError
          ? asyncError(new Error('Test Error'))
          : asyncData(members);
      },
    );
    const handleErrorSpy = errorHandlerSpy.handleError.and.stub();

    return {
      getMembersSpy,
      handleErrorSpy,
      isError,
    };
  }

  async function getService(isError = false) {
    const membersListResolverService = TestBed.get(MembersListResolverService);
    const membersServiceSpy = TestBed.get(MembersService);
    const errorHandlerSpy = TestBed.get(ErrorHandler);

    const { handleErrorSpy } = createSpies(
      membersServiceSpy,
      errorHandlerSpy,
      isError,
    );
    return {
      membersServiceSpy,
      handleErrorSpy,
      membersListResolverService,
    };
  }

  async function setup(isError = false) {
    await mainSetup();
    return getService(isError);
  }

  it('should be created', async () => {
    const { membersListResolverService } = await setup();
    expect(membersListResolverService).toBeTruthy();
  });

  it('should have an resolve function that returns the members', async () => {
    const { membersListResolverService } = await setup();
    /* call resolve */
    const members$ = membersListResolverService.resolve({}, {});
    const membersReturned = await members$.toPromise();
    expect(membersReturned).toEqual(members);
  });

  it('should have an resolve function that handles an error', async () => {
    const { membersListResolverService, handleErrorSpy } = await setup(true);
    /* call resolve */
    const members$ = membersListResolverService.resolve({}, {});
    const membersReturned = await members$.toPromise();
    expect(membersReturned).toEqual([]);
    expect(handleErrorSpy).toHaveBeenCalledTimes(1);
    /* call the returned getMembers() subscribable again */
    await members$.toPromise();
    /* handleError still only called once */
    expect(handleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
