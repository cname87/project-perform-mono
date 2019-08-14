import { APP_BASE_HREF } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AppModule } from '../../app.module';
import { CallbackComponent } from './callback.component';
import { AuthService } from '../../shared/auth.service/auth.service';
import { routes } from '../../config';

/* spy interfaces */
interface IAuthServiceSpy {
  getAuth0Client: jasmine.Spy;
  isAuthenticated: {
    next: jasmine.Spy;
  };
  profile: {
    next: jasmine.Spy;
  };
  route: string;
}
interface IRouterSpy {
  navigate: jasmine.Spy;
}

describe('CallbackComponent', () => {
  /* setup function run by each sub test suite*/
  async function mainSetup(route: string | boolean = 'default') {
    /* stub authService getAuth0Client method - define spy strategy below */
    let authServiceSpy = jasmine.createSpyObj('authService', [
      'getAuth0Client',
    ]);
    /* include authService properties isAuthenticated and profile in the spy */
    authServiceSpy = {
      ...authServiceSpy,
      isAuthenticated: {
        next: {},
      },
      profile: {
        next: {},
      },
      route,
    };

    /* spy on router.navigate */
    const routerSpy = jasmine.createSpyObj('router', ['navigate']);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  }

  function createSpies(authServiceSpy: IAuthServiceSpy, routerSpy: IRouterSpy) {
    /* set route to a supplied route or to a default value */
    const targetRoute =
      authServiceSpy.route === 'default' ? 'targetRoute' : authServiceSpy.route;
    /* auth0 client isAuthenticated() returns */
    const isAuthenticated = 'isAuthenticated';
    /* auth0 client getUser() returns */
    const testUser = 'testUser';

    /* spy on authService properties isAuthenticated and profile */
    const isAuthenticatedSpy = jasmine.createSpy();
    authServiceSpy.isAuthenticated.next = isAuthenticatedSpy;
    const profileSpy = jasmine.createSpy();
    authServiceSpy.profile.next = profileSpy;

    /* stub getAuth0Client() returning methods used */
    const getAuth0ClientSpy = authServiceSpy.getAuth0Client.and.callFake(() => {
      return {
        /* stub handleRedirectCallback */
        handleRedirectCallback: () => {
          return {
            appState: {
              target: targetRoute,
            },
          };
        },
        /* stub isAuthenticated function */
        isAuthenticated: () => isAuthenticated,
        /* stub getUser function */
        getUser: () => testUser,
      };
    });
    /* spy on router.navigate function */
    /* throw error if called with specific route */
    const navigateRouterSpy = routerSpy.navigate.and.callFake(
      (route: string) => {
        if (route[0] === 'triggerError') {
          throw new Error('test error');
        }
      },
    );

    /* return expected values */
    const expectedFromSpy = {
      targetRoute,
      testUser,
      isAuthenticated,
    };

    return {
      getAuth0ClientSpy,
      isAuthenticatedSpy,
      profileSpy,
      navigateRouterSpy,
      expectedFromSpy,
    };
  }

  function createExpected() {
    return {
      loginRoute: routes.loginTarget.path,
      emptyTargetRoute: '',
    };
  }

  /* create the component, and get test variables */
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(CallbackComponent);

    /* get the injected instances */
    const injector = fixture.debugElement.injector;
    const authServiceSpy = injector.get<IAuthServiceSpy>(AuthService as any);
    const routerSpy = injector.get<IRouterSpy>(Router as any);

    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* get the spies */
    const {
      getAuth0ClientSpy,
      isAuthenticatedSpy,
      profileSpy,
      navigateRouterSpy,
      expectedFromSpy,
    } = createSpies(authServiceSpy, routerSpy);

    return {
      fixture,
      component,
      getAuth0ClientSpy,
      navigateRouterSpy,
      isAuthenticatedSpy,
      profileSpy,
      expectedFromSpy,
      expected,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup(route: string | boolean = 'default') {
    await mainSetup(route);
    const testVars = await createComponent();
    return testVars;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup(route: string | boolean = 'default') {
    const testVars = await preSetup(route);
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

    it('should navigate to the target route)', async () => {
      const { navigateRouterSpy, expectedFromSpy } = await setup();
      expect(navigateRouterSpy).toHaveBeenCalledWith([
        expectedFromSpy.targetRoute,
      ]);
    });

    it('should broadcast isAuthenticated())', async () => {
      const { isAuthenticatedSpy, expectedFromSpy } = await setup();
      expect(isAuthenticatedSpy).toHaveBeenCalledWith(
        expectedFromSpy.isAuthenticated,
      );
    });

    it('should broadcast getUser())', async () => {
      const { profileSpy, expectedFromSpy } = await setup();
      expect(profileSpy).toHaveBeenCalledWith(expectedFromSpy.testUser);
    });

    it('should catch error and route to login page)', async () => {
      const { navigateRouterSpy, expectedFromSpy, expected } = await setup(
        'triggerError',
      );
      expect(navigateRouterSpy).toHaveBeenCalledWith([
        expectedFromSpy.targetRoute,
      ]);
      expect(navigateRouterSpy).toHaveBeenCalledWith([expected.loginRoute]);
    });

    it('should route to base url if no target supplied)', async () => {
      const { navigateRouterSpy, expected } = await setup(false);
      expect(navigateRouterSpy).toHaveBeenCalledWith([
        expected.emptyTargetRoute,
      ]);
    });
  });
});
