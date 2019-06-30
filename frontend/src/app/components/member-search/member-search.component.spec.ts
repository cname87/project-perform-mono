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
import { DebugElement } from '@angular/core';

import { AppModule } from '../../app.module';
import { MemberSearchComponent } from './member-search.component';
import { MembersService } from '../../shared/members-service/members.service';
import { members } from '../../shared/mocks/mock-members';
import { IMember } from '../../api/model/models';
import { sendInput } from '../../shared/test-helpers/index';

interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
}

describe('memberSearchComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* create spy objects */
    const memberServiceSpy = jasmine.createSpyObj('memberService', [
      'getMembers',
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
      return this.findAllTag('a');
    }

    constructor(readonly fixture: ComponentFixture<MemberSearchComponent>) {}

    private findTag<T>(tag: string): T {
      const element = this.fixture.debugElement.query(By.css(tag));
      return element.nativeElement;
    }
    private findAllTag(tag: string): DebugElement[] {
      const DebugElements = this.fixture.debugElement.queryAll(By.css(tag));
      return DebugElements;
    }
  }

  function createSpies(memberServiceSpy: IMembersServiceSpy) {
    /* return the mock members array unless '' is the search term */
    const getMembersSpy = memberServiceSpy.getMembers.and.callFake(
      (search: string) => {
        return search === '' ? of(undefined) : of(members);
      },
    );
    return { getMembersSpy };
  }

  function expected() {
    return {
      debounceDelay: 300,
    };
  }
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(MemberSearchComponent);

    /* get the injected instances */
    /* angular.io guide suggests you need to get these from injector.get.  It seemed to work when I just used the 'useValues' in configureTestingModule but now implementing as per guide */
    const membersServiceSpy = fixture.debugElement.injector.get<
      IMembersServiceSpy
    >(MembersService as any);

    const { getMembersSpy } = createSpies(membersServiceSpy);

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
      ...expectedValues,
    };
  }

  /* setup function run by each sub test function */
  async function setup() {
    await mainSetup();
    return createComponent();
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
    expect(page.anchors.length).toEqual(members.length, 'members found');
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
    expect(page.anchors.length).toEqual(members.length);
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
    expect(page.anchors[0].nativeElement.innerText).toEqual(
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
    expect(getMembersSpy.calls.count()).toBe(1, 'only one search');
    expect(page.anchors.length).toEqual(members.length, 'members found');
    /* click the input clear icon */
    page.clearBtn.click();
    fixture.detectChanges();
    tick(debounceDelay);
    fixture.detectChanges();
    expect(getMembersSpy.calls.count()).toBe(1, 'did not search again');
    expect(page.anchors.length).toEqual(0, 'no members found');
    expect(page.searchInput.value).toBe('', 'search box cleared');
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
