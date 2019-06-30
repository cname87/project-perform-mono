import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MembersService } from './members.service';
import { MessageService } from '../message-service/message.service';
import {
  MembersApi,
  IMemberWithoutId,
  IMember,
} from '../../api/api-members.service';
import { asyncData, asyncError } from '../test-helpers';
import { members } from '../mocks/mock-members';
import { ICount } from '../../api/model/count';
import { AppModule } from '../../app.module';
import { APP_BASE_HREF } from '@angular/common';

interface IMembersApiStub {
  getMembers: jasmine.Spy;
  getMember: jasmine.Spy;
  addMember: jasmine.Spy;
  deleteMember: jasmine.Spy;
  updateMember: jasmine.Spy;
}

interface IMessageServiceStub {
  messages: string[];
  add: jasmine.Spy;
  clear: jasmine.Spy;
}

describe('MembersService', () => {
  async function mainSetup() {
    /* create stub instances with spies for injection */
    const mockMembers = members;
    const membersApiStub: IMembersApiStub = {
      getMembers: jasmine.createSpy('getMembers').and.callFake(
        (str: string): Observable<IMember[]> => {
          /* test both types of 404 errors */
          if (str === null || str === 'errorTest404') {
            return asyncError(new HttpErrorResponse({ status: 404 }));
          }
          if (str === 'errorTest500') {
            return asyncError(new HttpErrorResponse({ status: 500 }));
          }
          return asyncData(mockMembers);
        },
      ),
      getMember: jasmine.createSpy('getMember').and.callFake(
        (id: number): Observable<any> => {
          if (id === 0) {
            return asyncError(
              new HttpErrorResponse({
                error: { name: 'HttpErrorResponse' },
                status: 404,
              }),
            );
          }
          if (id === -1) {
            return asyncError(
              new HttpErrorResponse({
                error: { name: 'HttpErrorResponse' },
                status: 500,
              }),
            );
          }
          return asyncData(mockMembers[0]);
        },
      ),
      addMember: jasmine
        .createSpy('addMember')
        .and.callFake((member: IMemberWithoutId) => {
          if (member.name === 'errorTest500') {
            return asyncError(new HttpErrorResponse({ status: 500 }));
          }
          return asyncData({ id: 21, name: member.name });
        }),
      deleteMember: jasmine.createSpy('deleteMember').and.callFake(
        (member: IMember | number): Observable<ICount> => {
          if (member === 0) {
            return asyncError(new HttpErrorResponse({ status: 404 }));
          }
          if (member === -1) {
            return asyncError(new HttpErrorResponse({ status: 500 }));
          }
          return asyncData({ count: 1 });
        },
      ),
      updateMember: jasmine.createSpy('updateMember').and.callFake(
        (member: IMember): Observable<IMember> => {
          if (member.id === 0) {
            return asyncError(new HttpErrorResponse({ status: 404 }));
          }
          if (member.id === -1) {
            return asyncError(new HttpErrorResponse({ status: 500 }));
          }
          return asyncData(mockMembers[0]);
        },
      ),
    };
    const messageServiceStub: IMessageServiceStub = {
      messages: [],
      add: jasmine
        .createSpy('add')
        .and.callFake(function add(this: IMessageServiceStub, message: string) {
          this.messages.push(message);
        }),
      clear: jasmine
        .createSpy('clear')
        .and.callFake(function clear(this: IMessageServiceStub) {
          this.messages = [];
        }),
    };

    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: MessageService, useValue: messageServiceStub },
        { provide: MembersApi, useValue: membersApiStub },
      ],
    }).compileComponents();

    const membersService: MembersService = TestBed.get(MembersService);
    const membersApi: IMembersApiStub = TestBed.get(MembersApi);
    const messageService: IMessageServiceStub = TestBed.get(MessageService);

    return {
      membersService,
      membersApi,
      messageService,
    };
  }

  async function setup() {
    return mainSetup();
  }

  describe('setup', () => {
    it('should be created', async () => {
      const { membersService } = await setup();
      expect(membersService).toBeTruthy();
    });
  });
  describe('getMembers', describeGetMembers);
  describe('getMember', describeGetMember);
  describe('addMember', describeAddMember);
  describe('deleteMember', describeDeleteMember);
  describe('updateMember', describeUpdateMember);

  async function describeGetMembers() {
    it('should have getMembers(" ") return []', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.getMembers(' ').toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        0,
        'api getMembers() not called',
      );
      expect(messageService.add.calls.count()).toEqual(0, 'no message logged');
      expect(result.length).toEqual(0, 'no members returned');
    });

    it('should have getMembers() return an array of members', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.getMembers().toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        1,
        'api getMembers() called once',
      );
      expect(membersApi.getMembers.calls.argsFor(0)[0]).toEqual(
        undefined,
        'api getMembers() called with undefined',
      );
      expect(messageService.add.calls.count()).toEqual(1, 'message logged');
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Fetched all members',
        'the message logged',
      );
      expect(result.length).toEqual(members.length, 'members returned');
      expect(result[0]).toEqual(members[0], 'member returned');
    });

    it('should have getMembers("test") return an array of members', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.getMembers('test').toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        1,
        'api getMembers() called once',
      );
      expect(membersApi.getMembers.calls.argsFor(0)[0]).toEqual(
        'test',
        'api getMembers() called with "test"',
      );
      expect(messageService.add.calls.count()).toEqual(1, 'message logged');
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Found members matching "test"',
        'the message logged',
      );
      expect(result.length).toEqual(members.length, 'members returned');
      expect(result[0]).toEqual(members[0], 'member returned');
    });

    it('should have getMembers("errorTest404") fail', async () => {
      const { membersService, membersApi, messageService } = await setup();
      /* will return 404 as if no members matching a search term */
      const result = await membersService
        .getMembers('errorTest404')
        .toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        1,
        'api getMembers() called once',
      );
      expect(messageService.add.calls.count()).toEqual(1, 'message logged');
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Did not find any members matching "errorTest404"',
        'error message logged',
      );
      expect(result.length).toEqual(0, 'empty array returned');
    });

    it('should have getMembers(null) fail', async () => {
      const { membersService, membersApi, messageService } = await setup();
      /* will return 404 as if members collection is empty */
      const result = await membersService.getMembers(null as any).toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        1,
        'api getMembers() called once',
      );
      expect(messageService.add.calls.count()).toEqual(1, 'message logged');
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: There are no members to fetch',
        'error message logged',
      );
      expect(result.length).toEqual(0, 'empty array returned');
    });

    it('should have getMembers("errorTest500") fail', async () => {
      const { membersService, membersApi, messageService } = await setup();

      /* server will return 500 error */
      membersService.getMembers('errorTest500').subscribe(
        () => {
          fail('Successfull response not expected');
        },
        (error: any) => {
          /* 500 error is thrown by getMembers() */
          expect(error.message).toBe(
            'Http failure response for (unknown url): 500 undefined',
          );
          /* test err.isHandled is set */
          expect(error.isHandled).toBe(true, 'User has been informed');
          /* test getMembers() has been called */
          expect(membersApi.getMembers.calls.count()).toEqual(
            1,
            'api getMembers() called once',
          );
          /* test user message */
          expect(messageService.add.calls.count()).toEqual(1, 'message logged');
          expect(messageService.add.calls.argsFor(0)[0]).toEqual(
            'MembersService: ERROR: Failed to get members from server',
            'error message logged',
          );
        },
      );
    });
  }
  async function describeGetMember() {
    it('should have getMember(id) return a member', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.getMember(1).toPromise();
      expect(membersApi.getMember.calls.count()).toEqual(
        1,
        'api getMember() called once',
      );
      expect(membersApi.getMember.calls.argsFor(0)[0]).toEqual(
        1,
        'api getMember() called with 1',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Fetched member with id = 1',
        'the message logged',
      );
      expect(result).toEqual(members[0], 'member returned');
    });

    it('should have getMember(0) / 404 fail', async () => {
      const { membersService, membersApi, messageService } = await setup();

      /* server will return 404 error */
      membersService.getMember(0).subscribe(
        () => {
          fail('Successful response not expected');
        },
        (error: any) => {
          /* 404 error is thrown by getMembers() */
          expect(error.message).toBe(
            'Http failure response for (unknown url): 404 undefined',
          );
          /* test err.isHandled is set */
          expect(error.isHandled).toBe(true, 'User has been informed');
          /* test getMember() has been called */
          expect(membersApi.getMember.calls.count()).toEqual(
            1,
            'api getMember() called once',
          );
          /* test user message */
          expect(messageService.add.calls.count()).toEqual(1, 'message logged');
          expect(messageService.add.calls.argsFor(0)[0]).toEqual(
            'MembersService: ERROR: Did not find member with id = 0',
            'error message logged',
          );
        },
      );
    });

    it('should have getMember(-1) fail', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService
        .getMember(-1)
        .toPromise()
        .catch((error) => {
          /* error is thrown by getMember() */
          expect(error.message).toBe(
            'Http failure response for (unknown url): 500 undefined',
          );
          expect(error.isHandled).toBe(true, 'User has been informed');
        });
      expect(membersApi.getMember.calls.count()).toEqual(
        1,
        'api getMember() called once (albeit with an error)',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: ERROR: Failed to get member from server',
        'error message logged',
      );
      expect(result).toBe(undefined, 'no member returned');
    });
  }
  async function describeAddMember() {
    it('should have addMember(memberWithoutId) return a member', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService
        .addMember({ name: 'testName' })
        .toPromise();
      expect(membersApi.addMember.calls.count()).toEqual(
        1,
        'addMember() called once',
      );
      expect(membersApi.addMember.calls.argsFor(0)[0]).toEqual(
        { name: 'testName' },
        'addMember() called with {name: "testName"}',
      );
      expect(messageService.add.calls.count()).toEqual(1, 'message logged');
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Added member with id = 21',
        'the message logged',
      );
      expect(result).toEqual({ id: 21, name: 'testName' }, 'member returned');
    });

    it('should have addMember({ "errorTest500" }) fail', async () => {
      const { membersService, membersApi, messageService } = await setup();

      await membersService.addMember({ name: 'errorTest500' }).subscribe(
        () => {
          fail('Successfull response not expected');
        },
        /* server will return 500 error */
        (error: any) => {
          /* 500 error is thrown by getMembers() */
          expect(error.message).toBe(
            'Http failure response for (unknown url): 500 undefined',
          );
          /* test err.isHandled is set */
          expect(error.isHandled).toBe(true, 'User has been informed');
          /* test getMembers() has been called */
          expect(membersApi.addMember.calls.count()).toEqual(
            1,
            'api addMember() called once',
          );
          /* test user message */
          expect(messageService.add.calls.count()).toEqual(1, 'message logged');
          expect(messageService.add.calls.argsFor(0)[0]).toEqual(
            'MembersService: ERROR: Failed to add member to server',
            'error message logged',
          );
        },
      );
    });
  }
  async function describeDeleteMember() {
    it('should have deleteMember(id) return count', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.deleteMember(1).toPromise();
      expect(membersApi.deleteMember.calls.count()).toEqual(
        1,
        'api deleteMember() called once',
      );
      expect(membersApi.deleteMember.calls.argsFor(0)[0]).toEqual(
        1,
        'api deleteMember() called with 1',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Deleted member with id = 1',
        'the message logged',
      );
      expect(result).toEqual({ count: 1 }, 'count returned');
    });

    it('should have deleteMember(member) return count', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService
        .deleteMember({ id: 1, name: 'testName' })
        .toPromise();
      expect(membersApi.deleteMember.calls.count()).toEqual(
        1,
        'api deleteMember() called once',
      );
      expect(membersApi.deleteMember.calls.argsFor(0)[0]).toEqual(
        1,
        'api deleteMember() called with 1',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Deleted member with id = 1',
        'the message logged',
      );
      expect(result).toEqual({ count: 1 }, 'count returned');
    });

    it('should have deleteMember(0) fail', async () => {
      const { membersService, membersApi, messageService } = await setup();

      /* server will return 404 error */
      await membersService.deleteMember(0).subscribe(
        () => {
          fail('Successfull response not expected');
        },
        (error: any) => {
          expect(error.message).toBe(
            'Http failure response for (unknown url): 404 undefined',
          );
          /* test err.isHandled is set */
          expect(error.isHandled).toBe(true, 'User has been informed');
          /* test api has been called */
          expect(membersApi.deleteMember.calls.count()).toEqual(
            1,
            'api deleteMember() called once',
          );
          /* test user message */
          expect(messageService.add.calls.count()).toEqual(1, 'message logged');
          expect(messageService.add.calls.argsFor(0)[0]).toEqual(
            'MembersService: ERROR: Did not find member with id = 0',
            'error message logged',
          );
        },
      );
    });

    it('should have deleteMember(-1) fail', async () => {
      const { membersService, membersApi, messageService } = await setup();

      /* server will return 500 error */
      await membersService.deleteMember(-1).subscribe(
        () => {
          fail('Successfull response not expected');
        },
        (error: any) => {
          expect(error.message).toBe(
            'Http failure response for (unknown url): 500 undefined',
          );
          /* test err.isHandled is set */
          expect(error.isHandled).toBe(true, 'User has been informed');
          /* test api has been called */
          expect(membersApi.deleteMember.calls.count()).toEqual(
            1,
            'api deleteMember() called once',
          );
          /* test user message */
          expect(messageService.add.calls.count()).toEqual(1, 'message logged');
          expect(messageService.add.calls.argsFor(0)[0]).toEqual(
            'MembersService: ERROR: Failed to delete member from server',
            'error message logged',
          );
        },
      );
    });
  }
  async function describeUpdateMember() {
    it('should have updateMember(member) return a member', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.updateMember(members[0]).toPromise();
      expect(membersApi.updateMember.calls.count()).toEqual(
        1,
        'updateMember() called once',
      );
      expect(membersApi.updateMember.calls.argsFor(0)[0]).toEqual(
        members[0],
        'updateMember() called with member',
      );
      expect(messageService.add.calls.count()).toEqual(1, 'message logged');
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        `MembersService: Updated member with id = ${members[0].id}`,
        'the message logged',
      );
      expect(result).toEqual(members[0], 'member returned');
    });

    it('should have updateMember(0) fail', async () => {
      const { membersService, membersApi, messageService } = await setup();

      /* server will return 404 error */
      await membersService.updateMember({ id: 0, name: 'test' }).subscribe(
        () => {
          fail('Successfull response not expected');
        },
        (error: any) => {
          expect(error.message).toBe(
            'Http failure response for (unknown url): 404 undefined',
          );
          /* test err.isHandled is set */
          expect(error.isHandled).toBe(true, 'User has been informed');
          /* test api has been called */
          expect(membersApi.updateMember.calls.count()).toEqual(
            1,
            'api updateMember() called once',
          );
          /* test user message */
          expect(messageService.add.calls.count()).toEqual(1, 'message logged');
          expect(messageService.add.calls.argsFor(0)[0]).toEqual(
            'MembersService: ERROR: Did not find member with id = 0',
            'error message logged',
          );
        },
      );
    });

    it('should have updateMember(-1) fail', async () => {
      const { membersService, membersApi, messageService } = await setup();

      /* server will return 500 error */
      await membersService.updateMember({ id: -1, name: 'test' }).subscribe(
        () => {
          fail('Successfull response not expected');
        },
        (error: any) => {
          expect(error.message).toBe(
            'Http failure response for (unknown url): 500 undefined',
          );
          /* test err.isHandled is set */
          expect(error.isHandled).toBe(true, 'User has been informed');
          /* test api has been called */
          expect(membersApi.updateMember.calls.count()).toEqual(
            1,
            'api updateMember() called once',
          );
          /* test user message */
          expect(messageService.add.calls.count()).toEqual(1, 'message logged');
          expect(messageService.add.calls.argsFor(0)[0]).toEqual(
            'MembersService: ERROR: Failed to update member on server',
            'error message logged',
          );
        },
      );
    });
  }
});
