import { ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { ErrorHandler } from '@angular/core';

import { DashboardComponent } from './dashboard.component';
/* members contains an array of 10 dummy members */
import { members } from '../../shared/mocks/mock-members';
import { MembersService } from '../../shared/members-service/members.service';
import { IMember } from '../../data-providers/models/models';
import { AppModule } from '../../app.module';
import {
  asyncError,
  asyncData,
  findAllCssOrNot,
} from '../../shared/test-helpers';

/* spy interfaces */
interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
}
interface IErrorHandlerSpy {
  handleError: jasmine.Spy;
}

describe('DashboardComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* create spy objects */
    const memberServiceSpy = jasmine.createSpyObj('memberService', [
      'getMembers',
    ]);
    const errorHandlerSpy = jasmine.createSpyObj('errorHandler', [
      'handleError',
    ]);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: MembersService, useValue: memberServiceSpy },
        { provide: ErrorHandler, useValue: errorHandlerSpy },
      ],
    }).compileComponents();
  }

  class Page {
    constructor(readonly fixture: ComponentFixture<DashboardComponent>) {}

    /* get DOM elements */
    get membersCards() {
      return findAllCssOrNot<HTMLAnchorElement>(this.fixture, 'app-card');
    }
    get membersLinks() {
      return findAllCssOrNot<HTMLAnchorElement>(this.fixture, 'a');
    }
  }

  function createSpies(
    memberServiceSpy: IMembersServiceSpy,
    errorHandlerSpy: IErrorHandlerSpy,
    isError = false,
  ) {
    /* mock the call to getMembers() */
    const getMembersSpy = memberServiceSpy.getMembers.and.callFake(
      /* returns the mock members array unless an input flag parameter is set in which case an error is thrown. */
      () => {
        return isError
          ? asyncError(new Error('Test Error'))
          : asyncData(members);
      },
    );

    /* mock the call to handleError */
    const handleErrorSpy = errorHandlerSpy.handleError.and.stub();

    return { getMembersSpy, handleErrorSpy };
  }

  function expected() {
    return {
      numInDashboard: 4,
    };
  }

  async function createComponent(isError = false) {
    /* create the fixture */
    const fixture = TestBed.createComponent(DashboardComponent);

    /* get the injected instances */
    /* angular.io guide suggests you need to get these from injector.get.  It seemed to work when I just used the 'useValues' in configureTestingModule but now implementing as per guide */
    const membersServiceSpy = fixture.debugElement.injector.get<
      IMembersServiceSpy
    >(MembersService as any);
    const errorHandlerSpy = fixture.debugElement.injector.get<IErrorHandlerSpy>(
      ErrorHandler as any,
    );

    /* create the spies */
    /* isError is passed to create a getMembersSpy that returns an error */
    const { getMembersSpy, handleErrorSpy } = createSpies(
      membersServiceSpy,
      errorHandlerSpy,
      isError,
    );

    /* create the component instance */
    const component = fixture.componentInstance;

    /* ngOnInit */
    fixture.detectChanges();

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    const expectedValues = expected();

    return {
      fixture,
      component,
      page,
      getMembersSpy,
      handleErrorSpy,
      ...expectedValues,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup(isError = false) {
    await mainSetup();
    const methods = await createComponent(isError);
    return methods;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup(isError = false) {
    const methods = await preSetup(isError);
    /* initiate ngOnInit and view changes etc */
    methods.fixture.detectChanges();
    await methods.fixture.whenStable();
    methods.fixture.detectChanges();
    await methods.fixture.whenStable();
    return methods;
  }

  it('should be created', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should call memberService.getMembers', async () => {
    const { getMembersSpy } = await setup();
    expect(getMembersSpy.calls.count()).toBe(1);
  });

  it('should display right number of links', async () => {
    const { page, numInDashboard } = await setup();
    expect(page.membersLinks!.length).toEqual(numInDashboard);
  });

  it('should display 1st member', async () => {
    const { component, page } = await setup();
    const member = component['firstMemberOnDisplay'];
    expect(page.membersCards![member - 1].innerText).toBe(
      'Name: ' + members[member - 1].name,
    );
  });

  it('should display last member', async () => {
    const { component, page } = await setup();
    const member = component['lastMemberOnDisplay'];
    expect(page.membersCards![member - 1].innerText).toBe(
      'Name: ' + members[member - 1].name,
    );
  });

  it('should handle a getMembers error', async () => {
    /* set getMembersSpy to return an error */
    const { component, page, getMembersSpy, handleErrorSpy } = await setup(
      true,
    );
    expect(getMembersSpy).toHaveBeenCalledTimes(1);
    const spyCalls = 1;
    expect(handleErrorSpy).toHaveBeenCalledTimes(spyCalls);
    /* test that handleError called with the thrown error */
    expect(handleErrorSpy.calls.argsFor(0)[0].message).toBe('Test Error');
    /* check no members in dashboard */
    expect(page.membersLinks).toBeNull();
    /* subscribe to the getMembers observable again */
    const numReturned = await component.members$.toPromise();
    /* this time test that an empty array returned */
    expect(numReturned).toEqual([]);
    /* check handleError still only called once */
    expect(handleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('should test trackBy function returns member.id', async () => {
    const { component } = await setup();
    const result = component.trackByFn(0, members[1]);
    expect(result).toEqual(members[1].id);
  });

  it('should test trackBy function returns null', async () => {
    const { component } = await setup();
    const result = component.trackByFn(0, (null as unknown) as IMember);
    expect(result).toEqual(null);
  });
});
