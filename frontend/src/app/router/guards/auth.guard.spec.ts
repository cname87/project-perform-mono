import { APP_BASE_HREF, Location } from '@angular/common';
import { TestBed, getTestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SpyLocation } from '@angular/common/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';

import { AppModule } from '../../app.module';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../../shared/auth.service/auth.service';
import { routes } from '../../config';

/* spy interfaces */
interface IAuthServiceSpy {
  getAuth0Client: jasmine.Spy;
  isAuthenticated: jasmine.Spy;
}

describe('AuthGuard', () => {
  /* setup function run by each sub test suite*/
  async function mainSetup() {
    /* stub authService getAuth0Client method - define spy strategy below */
    const authServiceSpy = jasmine.createSpyObj('authService', [
      'getAuth0Client',
    ]);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();
  }

  function createSpies(
    authServiceSpy: IAuthServiceSpy,
    authenticated: boolean,
  ) {
    /* stub getAuth0Client() returning isAuthenticated */
    const getAuth0ClientSpy = authServiceSpy.getAuth0Client.and.callFake(() => {
      return {
        /* set isAuthenticated() */
        isAuthenticated: () => {
          return authenticated;
        },
      };
    });
    return {
      getAuth0ClientSpy,
    };
  }

  function createExpected() {
    return {};
  }

  /* create the guard, and get test variables */
  async function createElement(authenticated: boolean) {
    /* get the injected instances */
    const testBed = getTestBed();
    const guard = testBed.get<AuthGuard>(AuthGuard) as AuthGuard;
    const authServiceSpy = testBed.get(AuthService) as IAuthServiceSpy;
    const router = testBed.get(Router) as Router;
    const spyLocation = testBed.get(Location) as SpyLocation;

    router.initialNavigation();

    const expected = createExpected();

    /* get the spies */
    const { getAuth0ClientSpy } = createSpies(authServiceSpy, authenticated);

    return {
      guard,
      authServiceSpy,
      spyLocation,
      getAuth0ClientSpy,
      expected,
    };
  }

  /* setup function run by each it test function */
  async function setup(authenticated = true) {
    await mainSetup();
    const testVars = await createElement(authenticated);
    return testVars;
  }

  describe('after setup', async () => {
    it('should be created', async () => {
      const { guard } = await setup();
      expect(guard).toBeTruthy('guard created');
    });
  });

  describe('canActivate', async () => {
    it('should return true when authenticated', async () => {
      const { guard } = await setup(true);
      expect(
        await guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      ).toEqual(true);
    });
    it('should return false when not authenticated', async () => {
      const { guard } = await setup(false);
      expect(
        await guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      ).toEqual(false);
    });
    it('should route to login when not authenticated', async () => {
      const { guard, spyLocation } = await setup(false);
      expect(
        await guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      ).toEqual(false);
      expect(spyLocation.path()).toEqual(routes.loginPage.path, 'login page');
    });
  });
});
