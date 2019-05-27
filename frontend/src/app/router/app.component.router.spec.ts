import { Location, APP_BASE_HREF } from '@angular/common';
import { DebugElement, Type } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router, RouterLinkWithHref } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpyLocation } from '@angular/common/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { click } from '../shared/test-helpers';
import { AppModule } from '../app.module';
import { AppComponent } from '../components/app/app.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { MembersListComponent } from '../components/members-list/members-list.component';
import { MembersService } from '../shared/services/members.service';
import { IMember } from '../api-members/model/models';
import { of, Observable } from 'rxjs';
import { PageNotFoundComponent } from '../components/page-not-found/page-not-found.component';
import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { config } from '../config';

interface IMembersServiceStub {
  getMembers: () => Observable<IMember[]>;
}

describe('AppComponent & RouterTestingModule', () => {
  /* setup function run by each 'it' test suite */
  async function mainSetup() {
    /* create stub instances with spies for injection */
    const membersServiceStub: IMembersServiceStub = {
      getMembers: () => {
        return of([{ id: 1, name: 'testName1' }]);
      },
    };

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: MembersService, useValue: membersServiceStub },
      ],
    }).compileComponents();
  }
  /* create an object capturing all key DOM elements */
  class Page {
    links: DebugElement[];
    dashboardLinkDe: DebugElement;
    membersLinkDe: DebugElement;

    constructor(readonly fixture: ComponentFixture<AppComponent>) {
      this.links = this.fixture.debugElement.queryAll(
        By.directive(RouterLinkWithHref),
      );
      this.dashboardLinkDe = this.links[0];
      this.membersLinkDe = this.links[1];
    }
  }

  /* create the component, initialize it & return test variables */
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(AppComponent);

    /* get the injected instances */
    const injector = fixture.debugElement.injector;
    const spyLocation = injector.get<SpyLocation>(Location as any);
    const membersServiceInjected = injector.get<MembersService>(
      MembersService as any,
    );
    const router = injector.get<Router>(Router);

    fixture.ngZone!.run(() => {
      // use ngZone to avoid ngZone warning
      router.initialNavigation();
    });

    /* create the component instance */
    const component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      router,
      spyLocation,
      page,
      membersServiceInjected,
    };
  }

  /* setup function run by each sub test function */
  async function setup() {
    await mainSetup();
    return createComponent();
  }

  function expectPathToBe(
    spyLocation: SpyLocation,
    path: string,
    expectationFailOutput?: any,
  ) {
    expect(spyLocation.path()).toEqual(
      path,
      expectationFailOutput || 'location.path()',
    );
  }

  function expectElementOf(
    fixture: ComponentFixture<AppComponent>,
    type: Type<any>,
  ): any {
    const el = fixture.debugElement.query(By.directive(type));
    expect(el).toBeTruthy('expected an element for ' + type.name);
    return el;
  }

  it('should navigate to "/dashboard" immediately', async () => {
    const { fixture, spyLocation } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spyLocation.path()).toEqual(
      '/dashboard',
      'after initialNavigation()',
    );
    expectElementOf(fixture, DashboardComponent);
  });

  it('should navigate to "/members" on click', async () => {
    const { fixture, page, spyLocation } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spyLocation.path()).toEqual(
      '/dashboard',
      'after initialNavigation()',
    );
    expectElementOf(fixture, DashboardComponent);
    fixture.ngZone!.run(() => {
      click(page.membersLinkDe);
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expectPathToBe(
      spyLocation,
      '/' + config.routes.members.path,
      'after clicking members link',
    );
    expectElementOf(fixture, MembersListComponent);
  });

  it('should navigate to "/dashboard" on click', async () => {
    const { fixture, page, spyLocation } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spyLocation.path()).toEqual(
      '/dashboard',
      'after initialNavigation()',
    );
    expectElementOf(fixture, DashboardComponent);
    fixture.ngZone!.run(() => {
      click(page.membersLinkDe);
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expectPathToBe(
      spyLocation,
      '/' + config.routes.members.path,
      'after clicking members link',
    );
    expectElementOf(fixture, MembersListComponent);
    fixture.ngZone!.run(() => {
      click(page.dashboardLinkDe);
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expectPathToBe(spyLocation, '/dashboard', 'after clicking dashboard link');
    expectElementOf(fixture, DashboardComponent);
  });

  it('should navigate to "/members" on browser URL change', async () => {
    const { fixture, spyLocation } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spyLocation.path()).toEqual(
      '/dashboard',
      'after initialNavigation()',
    );
    expectElementOf(fixture, DashboardComponent);
    fixture.ngZone!.run(() => {
      spyLocation.go('/' + config.routes.members.path);
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expectPathToBe(
      spyLocation,
      '/' + config.routes.members.path,
      'after clicking members link',
    );
    expectElementOf(fixture, MembersListComponent);
  });

  it('should navigate to "/detail/id"', async () => {
    const { fixture, spyLocation } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spyLocation.path()).toEqual(
      '/dashboard',
      'after initialNavigation()',
    );
    expectElementOf(fixture, DashboardComponent);
    fixture.ngZone!.run(() => {
      spyLocation.go('/detail/2');
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expectPathToBe(spyLocation, '/detail/2', 'after clicking members link');
    expectElementOf(fixture, MemberDetailComponent);
  });

  it('should navigate to "Page Not Found"', async () => {
    const { fixture, spyLocation } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spyLocation.path()).toEqual(
      '/dashboard',
      'after initialNavigation()',
    );
    expectElementOf(fixture, DashboardComponent);
    fixture.ngZone!.run(() => {
      spyLocation.go('/dummyUrl');
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expectPathToBe(spyLocation, '/dummyUrl', 'after clicking members link');
    expectElementOf(fixture, PageNotFoundComponent);
  });
});
