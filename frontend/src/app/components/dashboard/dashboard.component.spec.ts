import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

import { DashboardComponent } from './dashboard.component';
/* members contains an array of 10 dummy members */
import { members } from '../../shared/mocks/mock-members';
import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/model/models';
import { AppModule } from '../../app.module';
import { findAllTag } from '../../shared/test-helpers';

interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
}

describe('DashboardComponent', () => {
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
    constructor(readonly fixture: ComponentFixture<DashboardComponent>) {}

    /* get DOM elements */
    get membersDe() {
      return findAllTag(this.fixture, 'app-card');
    }
    get anchorsDe() {
      return findAllTag(this.fixture, 'a');
    }
  }

  function createSpies(memberServiceSpy: IMembersServiceSpy) {
    /* return the mock members array */
    const getMembersSpy = memberServiceSpy.getMembers.and.returnValue(
      of(members),
    );
    return { getMembersSpy };
  }

  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(DashboardComponent);

    /* get the injected instances */
    /* angular.io guide suggests you need to get these from injector.get.  It seemed to work when I just used the 'useValues' in configureTestingModule but now implementing as per guide */
    const membersServiceSpy = fixture.debugElement.injector.get<
      IMembersServiceSpy
    >(MembersService as any);

    /* create the spies */
    const { getMembersSpy } = createSpies(membersServiceSpy);

    /* create the component instance */
    const component = fixture.componentInstance;

    /* ngOnInit */
    fixture.detectChanges();

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      getMembersSpy,
    };
  }

  /* setup function run by each sub test function */
  async function setup() {
    await mainSetup();
    return createComponent();
  }

  it('should be created', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should call memberService.getMembers', async () => {
    const { getMembersSpy } = await setup();
    expect(getMembersSpy.calls.count()).toBe(1);
  });

  it('should display 4 links', async () => {
    const { page } = await setup();
    expect(page.anchorsDe.length).toEqual(4);
  });

  it('should display 1st member', async () => {
    const { component, page } = await setup();
    const member = component.firstMemberOnDisplay;
    expect(page.membersDe[member - 1].nativeElement.innerText).toBe(
      'Name: ' + members[member - 1].name,
    );
  });

  it('should display last member', async () => {
    const { component, page } = await setup();
    const member = component.lastMemberOnDisplay;
    expect(page.membersDe[member - 1].nativeElement.innerText).toBe(
      'Name: ' + members[member - 1].name,
    );
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
