import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MembersService } from './members.service';
import { MessageService } from './message.service';
import {
  MembersApi,
  IMemberWithoutId,
  IMember,
} from './api-members/api-members.service';
import { asyncData, asyncError } from './tests';
import { members } from './mock-members';
import { ICount } from './api-members/model/count';

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
          if (str === 'errorTest') {
            return asyncError(new HttpErrorResponse({ status: 500 }));
          }
          return asyncData(mockMembers);
        },
      ),
      getMember: jasmine.createSpy('getMember').and.callFake(
        (id: number): Observable<IMember> => {
          if (id === 0) {
            return asyncError(new HttpErrorResponse({ status: 404 }));
          }
          if (id === -1) {
            return asyncError(new HttpErrorResponse({ status: 500 }));
          }
          return asyncData(mockMembers[0]);
        },
      ),
      addMember: jasmine
        .createSpy('addMember')
        .and.callFake((member: IMemberWithoutId) => {
          if (member.name === 'errorTest') {
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
          console.log('MessageService: ' + message);
          this.messages.push(message);
        }),
      clear: jasmine
        .createSpy('clear')
        .and.callFake(function clear(this: IMessageServiceStub) {
          this.messages = [];
        }),
    };
    const consoleErrorSpy = spyOn(console, 'error');

    await TestBed.configureTestingModule({
      imports: [],
      declarations: [],
      providers: [
        MembersService,
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
      consoleErrorSpy,
    };
  }

  async function setup() {
    return mainSetup();
  }

  fdescribe('setup', () => {
    it('should be created', async () => {
      const { membersService } = await setup();
      expect(membersService).toBeTruthy();
    });
  });
  describe('getMembers', describeGetMembers);
  describe('getMember', describeGetMember);
  describe('getMember', describeAddMember);
  describe('getMember', describeDeleteMember);
  describe('getMember', describeUpdateMember);

  function describeGetMembers() {
    it('should have getMembers(" ") return []', async () => {
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService.getMembers(' ').toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        0,
        'getMembers() not called',
      );
      expect(messageService.add.calls.count()).toEqual(0, 'no message logged');
      expect(result.length).toEqual(0, 'no members returned');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should have getMembers() return an array of members', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.getMembers().toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        1,
        'getMembers() called once',
      );
      expect(membersApi.getMembers.calls.argsFor(0)[0]).toEqual(
        undefined,
        'getMembers() called with undefined',
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
        'getMembers() called once',
      );
      expect(membersApi.getMembers.calls.argsFor(0)[0]).toEqual(
        'test',
        'getMembers() called with "test"',
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
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService
        .getMembers('errorTest404')
        .toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        1,
        'getMembers() called once',
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
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should have getMembers(null) fail', async () => {
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService.getMembers(null as any).toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        1,
        'getMembers() called once',
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
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should have getMembers("errorTest") fail', async () => {
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();

      const result = await membersService.getMembers('errorTest').toPromise();
      expect(membersApi.getMembers.calls.count()).toEqual(
        1,
        'getMembers() called once',
      );
      expect(messageService.add.calls.count()).toEqual(1, 'message logged');
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: getMembers unexpected failure',
        'error message logged',
      );
      expect(result.length).toEqual(0, 'empty array returned');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  }
  function describeGetMember() {
    it('should have getMember(id) return a member', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.getMember(1).toPromise();
      expect(membersApi.getMember.calls.count()).toEqual(
        1,
        'getMember() called once',
      );
      expect(membersApi.getMember.calls.argsFor(0)[0]).toEqual(
        1,
        'getMember() called with 1',
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

    it('should have getMember(0) fail', async () => {
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService.getMember(0).toPromise();
      expect(membersApi.getMember.calls.count()).toEqual(
        1,
        'getMember() called once',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Did not find member with id = 0',
        'error message logged',
      );
      expect(result).toEqual({ id: 0, name: '' }, 'dummy member returned');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should have getMember(-1) fail', async () => {
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService.getMember(-1).toPromise();
      expect(membersApi.getMember.calls.count()).toEqual(
        1,
        'getMember() called once',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: getMember unexpected failure',
        'error message logged',
      );
      expect(result).toEqual({ id: 0, name: '' }, 'dummy member returned');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  }
  function describeAddMember() {
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

    it('should have addMember({ "errorTest" }) fail', async () => {
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService
        .addMember({ name: 'errorTest' })
        .toPromise();
      expect(membersApi.addMember.calls.count()).toEqual(
        1,
        'addMember() called once',
      );
      expect(messageService.add.calls.count()).toEqual(1, 'message logged');
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: addMember unexpected failure',
        'error message logged',
      );
      expect(result).toEqual({ id: 0, name: '' }, 'dummy member returned');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  }
  function describeDeleteMember() {
    it('should have deleteMember(id) return count', async () => {
      const { membersService, membersApi, messageService } = await setup();
      const result = await membersService.deleteMember(1).toPromise();
      expect(membersApi.deleteMember.calls.count()).toEqual(
        1,
        'deleteMember() called once',
      );
      expect(membersApi.deleteMember.calls.argsFor(0)[0]).toEqual(
        1,
        'deleteMember() called with 1',
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
        'deleteMember() called once',
      );
      expect(membersApi.deleteMember.calls.argsFor(0)[0]).toEqual(
        1,
        'deleteMember() called with 1',
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
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService.deleteMember(0).toPromise();
      expect(membersApi.deleteMember.calls.count()).toEqual(
        1,
        'deleteMember() called once',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Did not find member with id = 0',
        'error message logged',
      );
      expect(result).toEqual({ count: 0 }, 'count of 0 returned');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should have deleteMember(-1) fail', async () => {
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService.deleteMember(-1).toPromise();
      expect(membersApi.deleteMember.calls.count()).toEqual(
        1,
        'deleteMember() called once',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: deleteMember unexpected failure',
        'error message logged',
      );
      expect(result).toEqual({ count: 0 }, 'count of 0 returned');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  }
  function describeUpdateMember() {
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
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService
        .updateMember({ id: 0, name: 'testName' })
        .toPromise();
      expect(membersApi.updateMember.calls.count()).toEqual(
        1,
        'updateMember() called once',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: Did not find member with id = 0',
        'error message logged',
      );
      expect(result).toEqual({ id: 0, name: '' }, 'dummy member returned');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should have updateMember(-1) fail', async () => {
      const {
        membersService,
        membersApi,
        messageService,
        consoleErrorSpy,
      } = await setup();
      const result = await membersService
        .updateMember({ id: -1, name: 'testName' })
        .toPromise();
      expect(membersApi.updateMember.calls.count()).toEqual(
        1,
        'updateMember() called once',
      );
      expect(messageService.add.calls.count()).toEqual(
        1,
        'message log only called once',
      );
      expect(messageService.add.calls.argsFor(0)[0]).toEqual(
        'MembersService: updateMember unexpected failure',
        'error message logged',
      );
      expect(result).toEqual({ id: 0, name: '' }, 'dummy member returned');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  }
});
