import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { MemberDetailResolverService } from './member-detail-resolver.service';
import { AppModule } from '../../app.module';
import { asyncError, asyncData } from '../test-helpers';
import { members } from '../mocks/mock-members';
import { MembersService } from '../members-service/members.service';

interface IMembersServiceSpy {
  getMember: jasmine.Spy;
}
interface IErrorHandlerSpy {
  handleError: jasmine.Spy;
}
describe('MemberDetailResolverService', () => {
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    const membersServiceSpy = jasmine.createSpyObj('membersService', [
      'getMember',
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
        MemberDetailResolverService,
      ],
    }).compileComponents();
  }

  function createSpies(
    memberServiceSpy: IMembersServiceSpy,
    errorHandlerSpy: IErrorHandlerSpy,
    isError = false,
  ) {
    const getMembersSpy = memberServiceSpy.getMember.and.callFake(
      /* returns the mock members array unless an input flag parameter is set in which case an error is thrown. */
      (id: number) =>
        isError ? asyncError(new Error('Test Error')) : asyncData(members[id]),
    );
    const handleErrorSpy = errorHandlerSpy.handleError.and.stub();

    return {
      getMembersSpy,
      handleErrorSpy,
      isError,
    };
  }

  function getService(isError = false) {
    const memberDetailResolverService = TestBed.get(
      MemberDetailResolverService,
    );
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
      memberDetailResolverService,
    };
  }

  async function setup(isError = false) {
    await mainSetup();
    return getService(isError);
  }

  it('should be created', async () => {
    const { memberDetailResolverService } = await setup();
    expect(memberDetailResolverService).toBeTruthy();
  });

  it('should have an resolve function that returns a member', async () => {
    const id = 4;
    const route = {
      paramMap: {
        get: () => id,
      },
    };
    const { memberDetailResolverService } = await setup();
    /* call resolve */
    const member$ = memberDetailResolverService.resolve(route, {});
    const member = await member$.toPromise();
    expect(member.name).toEqual(members[id].name);
  });

  it('should have an resolve function that handles an error', async () => {
    const id = 4;
    const route = {
      paramMap: {
        get: () => id,
      },
    };
    const { memberDetailResolverService, handleErrorSpy } = await setup(true);
    /* call resolve */
    const member$ = memberDetailResolverService.resolve(route, {});
    const member = await member$.toPromise();
    expect(member.id).toEqual(0);
    expect(handleErrorSpy).toHaveBeenCalledTimes(1);
    /* call the returned getMembers() subscribable again */
    await member$.toPromise();
    /* handleError still only called once */
    expect(handleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
