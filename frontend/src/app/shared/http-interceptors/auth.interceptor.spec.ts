import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { Type } from '@angular/core';
import { HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AppModule } from '../../app.module';
import { AuthInterceptor } from './auth.interceptor';
import { MockAuthService } from '../mocks/mock-auth.service';
import { AuthService } from '../auth.service/auth.service';
import { IErrReport, errorTypes } from '../../config';

describe('AuthInterceptor', () => {
  async function mainSetup() {
    /* stub logger to avoid unnecessary logs */
    const ngxLoggerSpy = jasmine.createSpyObj('ngxLogger', ['trace', 'error']);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        AuthInterceptor,
        { provide: NGXLogger, useValue: ngxLoggerSpy },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();
  }

  /**
   * List all expected 'magic' values here to be used in tests.
   */
  function expected() {
    return {};
  }

  function createSpies() {
    /* create a next.handle function that can be spied upon */
    const nextSpy = jasmine.createSpyObj('next', ['handle']);
    const nextHandleSpy = nextSpy.handle.and.callFake((req: any) => {
      return of(req) as any;
    });

    return {
      nextSpy,
      nextHandleSpy,
    };
  }

  /**
   * Get the service, initialize it, set test variables.
   */
  async function getService() {
    const authInterceptor: AuthInterceptor = TestBed.get(
      AuthInterceptor as Type<AuthInterceptor>,
    );
    const authService: AuthService = TestBed.get(
      AuthService as Type<AuthService>,
    );

    return {
      authInterceptor,
      authService,
      /* give access to spies */
      ...createSpies(),
      /* give access to expected magic values */
      ...expected(),
    };
  }

  /* setup function run by each sub test function */
  async function setup() {
    await mainSetup();
    return getService();
  }

  describe('interceptor', async () => {
    it('should be created', async () => {
      const { authInterceptor } = await setup();
      expect(authInterceptor).toBeTruthy();
    });
  });

  describe('intercept function', async () => {
    it('should return a request with an Authorization header', async () => {
      const { authInterceptor, nextSpy } = await setup();
      const req = new HttpRequest('GET', 'www.test.com');
      const returned: any = await authInterceptor
        .intercept(req, nextSpy)
        .toPromise();
      expect(returned.headers.lazyUpdate[0].value).toEqual('Bearer testToken');
    });

    it('should return an error if incoming observable errors', async () => {
      const { authService, authInterceptor, nextSpy } = await setup();
      authService.getTokenSilently$ = () => {
        const testErr: IErrReport = {
          error: ({} as any) as HttpErrorResponse,
          allocatedType: errorTypes.notAssigned,
          isHandled: true,
        };
        return throwError(testErr);
      };
      const req = new HttpRequest('GET', 'www.test.com');
      try {
        await authInterceptor.intercept(req, nextSpy).toPromise();
      } catch (err) {
        expect(err.isHandled).toEqual(false); // initially true
      }
    });
  });
});
