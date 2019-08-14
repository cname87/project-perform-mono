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
import { MembersService } from '../shared/members-service/members.service';
import { IMember } from '../data-providers/models/models';
import { of, Observable } from 'rxjs';
import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { routes } from '../config';
import { InformationComponent } from '../components/information/information.component';
import { AuthService } from '../shared/auth.service/auth.service';
import { LoginComponent } from '../components/login/login.component';

interface IMembersServiceStub {
  getMembers: () => Observable<IMember[]>;
}
interface IAuthServiceSpy {
  getAuth0Client: jasmine.Spy;
  isAuthenticated: jasmine.Spy;
  profile: jasmine.Spy;
}

describe('RoutingModule', () => {
  /* setup function run by each 'it' test suite */
  async function mainSetup() {
    /* create stub instances with spies for injection */
    const membersServiceStub: IMembersServiceStub = {
      getMembers: () => {
        return of([{ id: 1, name: 'testName1' }]);
      },
    };

    /* stub authService getAuth0Client method - define spy strategy below */
    let authServiceSpy = jasmine.createSpyObj('authService', [
      'getAuth0Client',
    ]);
    /* stub authService properties isAuthenticated - define values below */
    authServiceSpy = {
      ...authServiceSpy,
      isAuthenticated: (fn: (value: boolean) => void) => {
        fn(true);
      },
      subscribe: (fn: (value: boolean) => void) => {
        fn(true);
      },
      profile: {
        subscribe: (fn: (value: string) => void) => {
          fn('testProfile');
        },
      },
    };

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: MembersService, useValue: membersServiceStub },
        { provide: AuthService, useValue: authServiceSpy },
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

  function createSpies(
    authServiceSpy: IAuthServiceSpy,
    authenticated: boolean,
  ) {
    /* stub getAuth0Client() returning isAuthenticated() */
    const getAuth0ClientSpy = authServiceSpy.getAuth0Client.and.callFake(() => {
      return {
        /* set isAuthenticated to return true */
        isAuthenticated: () => authenticated,
      };
    });
    /* stub isAuthenticated property to stub isAuthenticated.subscribe() */
    authServiceSpy.isAuthenticated = ({
      subscribe: (fn: (value: boolean) => void) => {
        fn(authenticated);
      },
    } as any) as jasmine.Spy<InferableFunction>;
    return {
      getAuth0ClientSpy,
    };
  }
  /* create the component, initialize it & return test variables */
  async function createComponent(authenticated: boolean) {
    /* create the fixture */
    const fixture = TestBed.createComponent(AppComponent);

    /* get the injected instances */
    const injector = fixture.debugElement.injector;
    const spyLocation = injector.get<SpyLocation>(Location as any);
    const membersServiceInjected = injector.get<MembersService>(
      MembersService as any,
    );
    const router = injector.get<Router>(Router);
    const authServiceSpy = injector.get<IAuthServiceSpy>(AuthService as any);

    fixture.ngZone!.run(() => {
      // use ngZone to avoid ngZone warning
      router.initialNavigation();
    });

    /* create the component instance */
    const component = fixture.componentInstance;

    /* get the spies */
    const { getAuth0ClientSpy } = createSpies(authServiceSpy, authenticated);

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
      getAuth0ClientSpy,
    };
  }

  /* setup function run by each sub test function */
  async function setup(authenticated = true) {
    await mainSetup();
    return createComponent(authenticated);
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

  it('should navigate to "/information/login" if not authenticated', async () => {
    const { fixture, spyLocation } = await setup(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spyLocation.path()).toEqual(
      '/information/login',
      'after initialNavigation() not authenticated',
    );
    expectElementOf(fixture, LoginComponent);
  });

  it('should navigate to "/dashboard" if authenticated', async () => {
    const { fixture, spyLocation } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spyLocation.path()).toEqual(
      '/dashboard',
      'after initialNavigation() authenticated',
    );
    expectElementOf(fixture, DashboardComponent);
  });

  it('should navigate to "/memberslist" on click', async () => {
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
      '/' + routes.membersList.path,
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
      '/' + routes.membersList.path,
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
      spyLocation.go('/' + routes.membersList.path);
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expectPathToBe(
      spyLocation,
      '/' + routes.membersList.path,
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

  it('should navigate to error information page for page not found', async () => {
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
    expectElementOf(fixture, InformationComponent);
  });
});
