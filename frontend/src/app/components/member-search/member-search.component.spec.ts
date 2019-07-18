import {
  async,
  TestBed,
  fakeAsync,
  tick,
  ComponentFixture,
} from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ErrorHandler } from '@angular/core';

import { AppModule } from '../../app.module';
import { MemberSearchComponent } from './member-search.component';
import { MembersService } from '../../shared/members-service/members.service';
import { members } from '../../shared/mocks/mock-members';
import { IMember } from '../../data-providers/models/models';
import {
  sendInput,
  asyncError,
  findAllCssOrNot,
  // asyncData,
} from '../../shared/test-helpers/index';

/* spy interfaces */
interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
}
interface IErrorHandlerSpy {
  handleError: jasmine.Spy;
}

describe('memberSearchComponent', () => {
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
    /* get DOM elements */
    get searchInput() {
      return this.findTag<HTMLInputElement>('input');
    }
    get header() {
      return this.findTag<HTMLElement>('mat-label');
    }
    get clearBtn() {
      return this.findTag<HTMLButtonElement>('button');
    }
    get hint() {
      return this.findTag<HTMLElement>('mat-hint');
    }
    get hintDebugElement() {
      return this.fixture.debugElement.queryAll(By.css('mat-hint'));
    }
    get anchors() {
      return findAllCssOrNot<HTMLAnchorElement>(this.fixture, 'a');
    }

    constructor(readonly fixture: ComponentFixture<MemberSearchComponent>) {}

    private findTag<T>(tag: string): T {
      const element = this.fixture.debugElement.query(By.css(tag));
      return element.nativeElement;
    }
  }

  function createSpies(
    memberServiceSpy: IMembersServiceSpy,
    errorHandlerSpy: IErrorHandlerSpy,
    isError = false,
  ) {
    /* return the mock members array unless '' is the search term */
    const getMembersSpy = memberServiceSpy.getMembers.and.callFake(
      (search: string) => {
        return isError
          ? asyncError(new Error('Test Error'))
          : search === ''
          ? of(undefined)
          : of(members);
      },
    );
    const handleErrorSpy = errorHandlerSpy.handleError.and.stub();
    return { getMembersSpy, handleErrorSpy };
  }

  function expected() {
    return {
      debounceDelay: 300,
    };
  }
  async function createComponent(isError = false) {
    /* create the fixture */
    const fixture = TestBed.createComponent(MemberSearchComponent);

    /* get the injected instances */
    /* angular.io guide suggests you need to get these from injector.get.  It seemed to work when I just used the 'useValues' in configureTestingModule but now implementing as per guide */
    const membersServiceSpy = fixture.debugElement.injector.get<
      IMembersServiceSpy
    >(MembersService as any);
    const errorHandlerSpy = fixture.debugElement.injector.get<IErrorHandlerSpy>(
      ErrorHandler as any,
    );

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

    /* get he expected magic values */
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

  /* setup function run by each sub test function */
  async function setup(isError = false) {
    await mainSetup();
    return createComponent(isError);
  }

  it('should be created', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy('component created');
  });

  it('should display the title', async(async () => {
    const { component, page, debounceDelay } = await setup();
    expect(page.header.innerText).toBe(component.header, 'header');
    /* check debounce delay against local variable */
    expect(component['debounce']).toBe(debounceDelay, 'check delay');
  }));

  it('should take input and show search results', fakeAsync(async () => {
    const { fixture, page, getMembersSpy, debounceDelay } = await setup();
    sendInput(fixture, page.searchInput, 'x');
    fixture.detectChanges();
    tick(debounceDelay);
    fixture.detectChanges();
    expect(getMembersSpy.calls.count()).toBe(1, 'only one search');
    expect(page.anchors!.length).toEqual(members.length, 'members found');
    /* hint will show as members found */
    expect(page.hint).not.toBeNull;
  }));

  it('should not search when no delay', fakeAsync(async () => {
    const {
      component,
      fixture,
      page,
      getMembersSpy,
      debounceDelay,
    } = await setup();
    component.search('x');
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(0);
    /* no search made */
    expect(getMembersSpy.calls.count()).toBe(0);
    /* no hint shown */
    expect(page.hintDebugElement).toBeNull;
    /* clear timer */
    tick(debounceDelay);
  }));

  it('should show not search with no change', fakeAsync(async () => {
    const {
      component,
      fixture,
      page,
      getMembersSpy,
      debounceDelay,
    } = await setup();
    component.search('x');
    fixture.detectChanges();
    tick(debounceDelay);
    fixture.detectChanges();
    expect(page.anchors!.length).toEqual(members.length);
    expect(getMembersSpy.calls.count()).toBe(1, 'only one search');

    /* second search */
    component.search('x');
    fixture.detectChanges();
    tick(debounceDelay);
    fixture.detectChanges();
    /* no change in getMemberSpy call count */
    expect(getMembersSpy.calls.count()).toBe(1, 'only one search');
  }));

  it('should display 1st member', fakeAsync(async () => {
    const { component, fixture, page, debounceDelay } = await setup();
    component.search('x');
    fixture.detectChanges();
    tick(debounceDelay);
    fixture.detectChanges();

    /* first listed will be the display property of the first member */
    expect(page.anchors![0].innerText).toEqual(
      members[0][component.propertyToDisplay],
      'member property displayed',
    );
  }));

  it('should clear input when button clicked', fakeAsync(async () => {
    const { fixture, page, getMembersSpy, debounceDelay } = await setup();
    sendInput(fixture, page.searchInput, 'x');
    fixture.detectChanges();
    tick(debounceDelay);
    fixture.detectChanges();
    let numSearches = 0;
    expect(getMembersSpy.calls.count()).toBe(++numSearches, 'only one search');
    expect(page.anchors!.length).toEqual(members.length, 'members found');
    /* click the input clear icon */
    page.clearBtn.click();
    fixture.detectChanges();
    tick(debounceDelay);
    fixture.detectChanges();
    expect(getMembersSpy.calls.count()).toBe(++numSearches, 'searches again');
    expect(getMembersSpy.calls.allArgs()[1]).toEqual(
      [''],
      'called with empty string',
    );
    expect(page.anchors).toBeNull('no members found');
    expect(page.searchInput.value).toBe('', 'search box cleared');
  }));

  it('should handle a getMembers error', fakeAsync(async () => {
    const {
      fixture,
      component,
      page,
      getMembersSpy,
      handleErrorSpy,
      debounceDelay,
    } = await setup(true);
    component.search('x');
    fixture.detectChanges();
    tick(debounceDelay);
    fixture.detectChanges();
    expect(getMembersSpy).toHaveBeenCalledTimes(1);
    expect(handleErrorSpy).toHaveBeenCalledTimes(1);
    /* test that handleError called with the thrown error */
    expect(handleErrorSpy.calls.argsFor(0)[0].message).toBe('Test Error');
    /* check no members */
    expect(page.anchors).toBeNull();

    /* subscribe to the searchTerms$ subject again */
    const numReturned = await component.members$.toPromise();
    /* this time test that an empty array returned */
    expect(numReturned).toEqual([]);
    /* check handleError still only called once */
    expect(handleErrorSpy).toHaveBeenCalledTimes(1);
  }));

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
