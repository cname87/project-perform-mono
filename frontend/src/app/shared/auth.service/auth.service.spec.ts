import { APP_BASE_HREF } from '@angular/common';
import { TestBed, getTestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { AuthService } from './auth.service';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { NGXLogger } from 'ngx-logger';

/* spy interfaces */
interface ILoggerSpy {
  error: jasmine.Spy;
}

/* Note: The Auth0 service must be accessible and operational for these tests */

describe('AuthService', () => {
  /* setup function run by each sub test suite*/
  async function mainSetup() {
    /* set up spies */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: NGXLogger, useValue: loggerSpy },
      ],
    }).compileComponents();
  }

  function createSpies() {
    return {};
  }

  function createExpected() {
    return {};
  }

  /* create the guard, and get test variables */
  async function createElement() {
    /* get the injected instances */
    const testBed = getTestBed();
    const authService = testBed.get(AuthService) as AuthService;
    const loggerSpy = testBed.get(NGXLogger) as ILoggerSpy;

    const expected = createExpected();

    /* get the spies */
    const {} = createSpies();

    return {
      authService,
      loggerSpy,
      expected,
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
      const { authService } = await setup();
      expect(authService).toBeTruthy('service created');
    });
  });

  describe('getAuth0Client', async () => {
    it('should return an existing instance', async () => {
      const { authService } = await setup();
      /* create a dummy existing instance */
      const testAuth0Client = ('testAuth0Client' as any) as Auth0Client;
      authService['auth0Client'] = testAuth0Client;
      const client = await authService.getAuth0Client();
      /* test the dummy instance has been created */
      expect(client).toEqual(testAuth0Client);
    });

    it('should return a new instance', async () => {
      const { authService } = await setup();
      const client = await authService.getAuth0Client();
      /* test an auth0 client instance has been returned */
      expect(client['options']).toBeTruthy();
    });

    it('should not call auth0ClientPromise twice', async () => {
      const { authService } = await setup();

      /* run getAuth0Client which sets auth0ClientPromise */
      await authService.getAuth0Client();

      /* add a property to auth0ClientPromise to prove it is returned rather than a new version being created */
      const clientPromise = await authService['auth0ClientPromise'];
      const testObject = { testProperty: 'test' };
      Object.assign(clientPromise, testObject);
      authService['auth0ClientPromise'] = clientPromise as any;

      /* run again which returns auth0Client from auth0ClientPromise */
      const client = await authService.getAuth0Client();

      /* test the new auth0 client instance has been returned */
      expect(client['testProperty']).toEqual('test');
    });

    it('should broadcast authenticated status', async () => {
      const { authService } = await setup();

      /* stub auth0Client functions */
      const dummyAuth0Client: any = {
        isAuthenticated: () => 'testTrue',
        getUser: () => 'testProfile',
        getTokenSilently: () => 'testToken',
      };
      authService['auth0ClientPromise'] = dummyAuth0Client;

      /* run getAuth0Client which sets subjects */
      await authService.getAuth0Client();

      authService.isAuthenticated.subscribe((isAuthenticated: boolean) => {
        expect(isAuthenticated).toBe('testTrue' as any);
      });
    });

    it('should broadcast profile', async () => {
      const { authService } = await setup();

      /* stub auth0Client functions */
      const dummyAuth0Client: any = {
        isAuthenticated: () => true,
        getUser: () => 'testProfile',
        getTokenSilently: () => 'testToken',
      };
      authService['auth0ClientPromise'] = dummyAuth0Client;

      /* run getAuth0Client which sets subjects */
      await authService.getAuth0Client();

      authService.profile.subscribe((profile: string) => {
        expect(profile).toBe('testProfile');
      });
    });

    it('should broadcast token', async () => {
      const { authService } = await setup();

      /* stub auth0Client functions */
      const dummyAuth0Client: any = {
        isAuthenticated: () => true,
        getUser: () => 'testProfile',
        getTokenSilently: () => 'testToken',
      };
      authService['auth0ClientPromise'] = dummyAuth0Client;

      /* run getAuth0Client which sets subjects  */
      await authService.getAuth0Client();

      authService.token.subscribe((token: string) => {
        expect(token).toBe('testToken');
      });
    });

    it('should broadcast profile as null if not authenticated', async () => {
      const { authService } = await setup();

      /* stub auth0Client functions */
      const dummyAuth0Client: any = {
        isAuthenticated: () => false,
        getUser: () => 'testProfile',
        getTokenSilently: () => 'testToken',
      };
      authService['auth0ClientPromise'] = dummyAuth0Client;

      /* run getAuth0Client which sets subjects  */
      await authService.getAuth0Client();

      authService.profile.subscribe((profile: string) => {
        expect(profile).toBeNull();
      });
    });
  });
});
