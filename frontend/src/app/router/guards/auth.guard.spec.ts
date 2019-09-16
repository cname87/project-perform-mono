import { APP_BASE_HREF } from '@angular/common';
import { TestBed, getTestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { AuthGuard } from './auth.guard';
import { MockAuthService } from '../../shared/mocks/mock-auth.service';
import { AuthService } from '../../shared/auth.service/auth.service';
import { routes } from '../../config';
import { Observable, from } from 'rxjs';

describe('AuthGuard', () => {
  /* setup function run by each sub test suite*/
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);

    /* stub router for ease of test*/
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    /* note that AuthService is mocked */

    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: AuthService, useClass: MockAuthService },
        { provide: NGXLogger, useValue: loggerSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  }

  /* create the guard, and get test variables */
  async function createElement() {
    /* get the injected instances */
    const testBed = getTestBed();
    const guard = testBed.get<AuthGuard>(AuthGuard) as AuthGuard;
    const authService = testBed.get(AuthService);
    const router = testBed.get(Router);

    return {
      guard,
      authService,
      router,
    };
  }

  /* setup function run by each it test function */
  async function setup() {
    await mainSetup();
    const testVars = await createElement();
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
      const { guard } = await setup();
      const result$ = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ) as Observable<boolean>;
      expect(await result$.toPromise()).toEqual(true);
    });
    it('should return false when not authenticated', async () => {
      const { authService, guard } = await setup();
      /* override authService.isAuthenticated$ */
      authService.isAuthenticated$ = from(Promise.resolve(false));
      const result$ = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ) as Observable<boolean>;
      expect(await result$.toPromise()).toEqual(false);
    });
    it('should route to login when not authenticated', async () => {
      const { authService, guard, router } = await setup();
      /* stub call to router.navigate */
      const routerNavigateSpy = router.navigate.and.stub();
      /* override authService.isAuthenticated$ */
      authService.isAuthenticated$ = from(Promise.resolve(false));
      const result$ = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ) as Observable<boolean>;
      expect(await result$.toPromise()).toEqual(false);
      expect(routerNavigateSpy).toHaveBeenCalledWith([routes.loginPage.path]);
    });
  });
});
