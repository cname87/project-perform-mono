/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { ActivatedRoute } from '@angular/router';

import { DashboardComponent } from './dashboard.component';
/* members contains an array of 10 dummy members */
import { members } from '../../shared/mocks/mock-members';
import { IMember } from '../../data-providers/models/models';
import { AppModule } from '../../app.module';
import { ActivatedRouteStub, findAllCssOrNot } from '../../shared/test-helpers';

describe('DashboardComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);

    /* stub ActivatedRoute with a configurable path parameter */
    const activatedRouteStub = new ActivatedRouteStub();

    /* set up Testbed */
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: NGXLogger, useValue: loggerSpy },
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

  function expected() {
    return {
      numInDashboard: 4,
    };
  }

  function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(DashboardComponent);

    /* get the injected instances */
    const activatedRouteStub = fixture.debugElement.injector.get<
      ActivatedRouteStub
    >(ActivatedRoute as any);

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
      activatedRouteStub,
      ...expectedValues,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup() {
    await mainSetup();
    const methods = createComponent();
    return methods;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup() {
    const methods = await preSetup();
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

  it('should load members$ with the top members', async () => {
    const { component, numInDashboard } = await setup();
    const topMembers = await component.members$.toPromise();
    expect(topMembers.length).toEqual(numInDashboard);
  });

  it('should display right number of links', async () => {
    const { page, numInDashboard } = await setup();
    expect(page.membersLinks!.length).toEqual(numInDashboard);
  });

  it('should display 1st member', async () => {
    const { component, page } = await setup();
    const member = (component as any).firstMemberOnDisplay;
    expect(page.membersCards![member - 1].innerText).toBe(
      `Name: ${members[member - 1].name}`,
    );
  });

  it('should display last member', async () => {
    const { component, page } = await setup();
    const member = (component as any).lastMemberOnDisplay;
    expect(page.membersCards![member - 1].innerText).toBe(
      `Name: ${members[member - 1].name}`,
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
