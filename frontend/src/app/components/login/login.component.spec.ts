/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { APP_BASE_HREF } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
// import { RouterTestingModule } from '@angular/router/testing';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { LoginComponent } from './login.component';
import { AuthService } from '../../shared/auth.service/auth.service';
import {
  findCssOrNot,
  click,
  findRouterLinks,
  RouterLinkDirectiveStub,
} from '../../shared/test-helpers';
import { routes } from '../../config';

/* spy interfaces */
interface IAuthServiceSpy {
  login: jasmine.Spy;
  logout: jasmine.Spy;
  isLoggedIn: boolean;
}

describe('LoginComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);

    /* stub authService login() and logout() method - define spy strategy below */
    let authServiceSpy = jasmine.createSpyObj('authService', [
      'login',
      'logout',
    ]);
    /* stub authService property isLoggedIn - define values below */
    authServiceSpy = {
      ...authServiceSpy,
      isLoggedIn: true,
    };

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NGXLogger, useValue: loggerSpy },
      ],
    })
      .overrideModule(AppModule, {
        add: {
          /* must declare RouterLinkDirective in AppModule override */
          declarations: [RouterLinkDirectiveStub],
        },
      })
      .compileComponents();
  }

  /* get key DOM elements */
  class Page {
    get header() {
      return findCssOrNot<HTMLSpanElement>(
        this.fixture,
        'mat-toolbar > span.header',
      );
    }

    get loginButton() {
      return findCssOrNot<HTMLButtonElement>(this.fixture, '#loginBtn');
    }

    get logoutButton() {
      return findCssOrNot<HTMLButtonElement>(this.fixture, '#logoutBtn');
    }

    get profileButton() {
      return findCssOrNot<HTMLAnchorElement>(this.fixture, '#profileBtn');
    }

    /* gets all the routerLink directive instances */
    get routerLinks() {
      return findRouterLinks<RouterLinkDirectiveStub>(
        this.fixture,
        RouterLinkDirectiveStub,
      );
    }

    constructor(readonly fixture: ComponentFixture<LoginComponent>) {}
  }

  function createSpies(authServiceSpy: IAuthServiceSpy) {
    /* stub login() and logout() */
    const loginSpy = authServiceSpy.login.and.stub();
    const logoutSpy = authServiceSpy.logout.and.stub();

    /* stub isLoggedIn property defaulting to true */
    authServiceSpy.isLoggedIn = true;
    return {
      loginSpy,
      logoutSpy,
    };
  }

  function createExpected() {
    return {
      header: 'Team Members',
      path: [routes.profile.path],
    };
  }

  /* create the component, and get test variables */
  function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(LoginComponent);

    /* get the injected instances */
    const { injector } = fixture.debugElement;
    const authServiceSpy = injector.get<IAuthServiceSpy>(AuthService as any);

    const { loginSpy, logoutSpy } = createSpies(authServiceSpy);
    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      authServiceSpy,
      loginSpy,
      logoutSpy,
      expected,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup() {
    await mainSetup();
    const testVars = createComponent();
    return testVars;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup() {
    const testVars = await preSetup();
    /* initiate ngOnInit and view changes etc */
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    return testVars;
  }

  describe('after ngOnInit', () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });
  });

  describe('page', () => {
    it('should have the expected header', async () => {
      const { page, expected } = await setup();
      expect(page.header!.innerText).toBe(expected.header, 'header');
    });

    it('should show all but login button when authenticated', async () => {
      const { page, expected } = await setup();
      /* isLoggedIn is true as stubbed authService sets it true) */
      expect(page.header!.innerText).toBe(expected.header, 'header');
      expect(page.logoutButton).toBeTruthy('logout button');
      expect(page.profileButton).toBeTruthy('profile button');
      expect(page.loginButton).toBeFalsy('login button');
    });

    it('should only show login button when not authenticated', async () => {
      const { fixture, page, authServiceSpy, expected } = await setup();
      authServiceSpy.isLoggedIn = false;
      /* await page update */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.header!.innerText).toBe(expected.header, 'header');
      expect(page.logoutButton).toBeFalsy('logout button');
      expect(page.profileButton).toBeFalsy('profile button');
      expect(page.loginButton).toBeTruthy('login button');
    });
  });

  describe('user actions', () => {
    it('should allow login', async () => {
      const { fixture, page, authServiceSpy, loginSpy } = await setup();
      authServiceSpy.isLoggedIn = false;
      /* await page update */
      fixture.detectChanges();
      await fixture.whenStable();
      const button = page.loginButton;
      click(button!);
      expect(loginSpy).toHaveBeenCalled();
    });

    it('should allow logout', async () => {
      const { page, logoutSpy } = await setup();
      /* isLoggedIn is true as stubbed authService sets it true) */
      const button = page.logoutButton;
      click(button!);
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('should allow profile to be displayed', async () => {
      const { page, expected } = await setup();
      /* isLoggedIn is true as stubbed authService sets it true) */

      /* get the routerLink directive instance */
      const routerLink = page.routerLinks[0];
      expect(routerLink.navigatedTo).toBeNull('not navigated yet');

      /* click the profile button which is captured by RouterLinkDirectiveStub */
      click(page.profileButton!);

      /* the correct url is sent to route to the profile component */
      expect(routerLink.navigatedTo).toEqual(expected.path, 'has navigated');
    });
  });
});
