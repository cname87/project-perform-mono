import { APP_BASE_HREF } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { AppModule } from '../../app.module';
import { LoginComponent } from './login.component';
import { AuthService } from '../../shared/auth.service/auth.service';
import {
  findCssOrNot,
  click,
  findRouterLinks,
  RouterLinkDirectiveStub,
} from '../../shared/test-helpers';
import { auth0Config } from '../../config';

/* spy interfaces */
interface IAuthServiceSpy {
  getAuth0Client: jasmine.Spy;
  isAuthenticated: jasmine.Spy;
  profile: jasmine.Spy;
}

fdescribe('LoginComponent', () => {
  /* setup function run by each sub test suite*/
  async function mainSetup() {
    /* stub authService getAuth0Client method - define spy strategy below */
    let authServiceSpy = jasmine.createSpyObj('authService', [
      'getAuth0Client',
    ]);
    /* stub authService properties isAuthenticated and profile - define values below */
    authServiceSpy = {
      ...authServiceSpy,
      isAuthenticated: {},
      profile: {},
    };

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule,
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: AuthService, useValue: authServiceSpy },
      ],
    })
    /* declare RouterLinkDirective in AppModule override (rather than declaring it in AppModule - declaring locally whilst importing AppModule appears not to work) */
    .overrideModule(AppModule, {
      add: {
        declarations: [
          RouterLinkDirectiveStub,
        ],
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
      return findRouterLinks<RouterLinkDirectiveStub>(this.fixture, RouterLinkDirectiveStub);
    }

    constructor(readonly fixture: ComponentFixture<LoginComponent>) {}
  }

  function createSpies(
    authServiceSpy: IAuthServiceSpy,
    component: LoginComponent,
  ) {
    /* stub getAuth0Client() returning loginDirect & logout */
    const getAuth0ClientSpy = authServiceSpy.getAuth0Client.and.callFake(() => {
      return {
        /* set component profile to allow you test that loginWithRedirect was called */
        loginWithRedirect: (...args: any[]) => {
          component.profile = args;
        },
        /* set component profile to allow you test that logout was called */
        logout: (...args: any[]) => {
          component.profile = args;
        },
      };
    });
    /* stub isAuthenticated property to stub isAuthenticated.subscribe() */
    authServiceSpy.isAuthenticated = ({
      subscribe: () => {
        component.isAuthenticated = true;
      },
    } as any) as jasmine.Spy<InferableFunction>;
    /* stub profile property to stub profile.subscribe() */
    authServiceSpy.profile = ({
      subscribe: () => {
        component.profile = true;
      },
    } as any) as jasmine.Spy<InferableFunction>;
    return {
      getAuth0ClientSpy,
    };
  }

  function createExpected() {
    return {
      header: 'Team Members',
      loginResponse: [
        {
          appState: {
            target: '/dashboard',
          },
        },
      ],
      logoutResponse: [
        {
          client_id: auth0Config.client_id,
          returnTo: window.location.origin,
        },
      ],
      path: ['profile'],
    };
  }

  /* create the component, and get test variables */
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(LoginComponent);

    /* get the injected instances */
    const injector = fixture.debugElement.injector;
    const authServiceSpy = injector.get<IAuthServiceSpy>(AuthService as any);

    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* get the spies */
    const { getAuth0ClientSpy } = createSpies(authServiceSpy, component);

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      getAuth0ClientSpy,
      expected,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup() {
    await mainSetup();
    const testVars = await createComponent();
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

  describe('after ngOnInit', async () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });

    /* component property auth0Client should have a loginDirect property supplied by the authService spy */
    it(' should have getAuth0Client called', async () => {
      const { component } = await setup();
      expect(component['auth0Client'].loginWithRedirect)
        .toBeTruthy('getAuth0Client called');
    });

    /* component property isAuthenticated should be set uo true */
    it('should have isAuthenticated set', async () => {
      const { component } = await setup();
      expect(component.isAuthenticated).toBeTruthy('isAuthenticated set');
    });

    /* component property isAuthenticated should be set uo true */
    it('should have profile set', async () => {
      const { component } = await setup();
      expect(component.profile).toBeTruthy('profile set');
    });
  });

  describe('page', async () => {
    it('should have the expected header', async () => {
      const { page, expected } = await setup();
      expect(page.header!.innerText).toBe(expected.header, 'header');
    });

    it('should show all but login button when authenticated', async () => {
      const { page, expected } = await setup();
      /* isAuthenticated is true as stubbed authService sets it true) */
      expect(page.header!.innerText).toBe(expected.header, 'header');
      expect(page.logoutButton).toBeTruthy('logout button');
      expect(page.profileButton).toBeTruthy('profile button');
      expect(page.loginButton).toBeFalsy('login button');
    });

    it('should only show login button when not authenticated', async () => {
      const { fixture, component, page, expected } = await setup();
      /* set isAuthenticated false (as stubbed authService sets it true) */
      component.isAuthenticated = false;
      /* await page update */
      fixture.detectChanges();
      fixture.whenStable();
      expect(page.header!.innerText).toBe(expected.header, 'header');
      expect(page.logoutButton).toBeFalsy('logout button');
      expect(page.profileButton).toBeFalsy('profile button');
      expect(page.loginButton).toBeTruthy('login button');
    });
  });

  describe('user actions', async () => {
    it('should allow login', async () => {
      const { fixture, component, page, expected } = await setup();
      /* set isAuthenticated false (as stubbed authService sets it true) */
      component.isAuthenticated = false;
      /* await page update */
      fixture.detectChanges();
      fixture.whenStable();
      const button = page.loginButton;
      click(button!);
      expect(component.profile).toEqual(expected.loginResponse, 'logged in');
    });

    it('should allow logout', async () => {
      const { component, page, expected } = await setup();
      /* isAuthenticated is true as stubbed authService sets it true) */
      const button = page.logoutButton;
      click(button!);
      expect(component.profile).toEqual(expected.logoutResponse, 'logged out');
    });

    it('should allow profile to be displayed', async () => {
      const { page, expected } = await setup();
      /* isAuthenticated is true as stubbed authService sets it true) */

      /* get the routerLink directive instance */
      const routerLink = page.routerLinks[0];
      expect(routerLink.navigatedTo).toBeNull('not navigated yet');

      /* click the profile button which is captured by RouterLinkDirectiveStub*/
      click(page.profileButton!);

      /* the correct url is sent to route to the profile component */
      expect(routerLink.navigatedTo).toEqual(expected.path, 'has navigated');
    });
  });
});
