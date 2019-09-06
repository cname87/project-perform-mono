import { APP_BASE_HREF } from '@angular/common';
import { TestBed, getTestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { AuthService } from './auth.service';
import { NGXLogger } from 'ngx-logger';

/* spy interfaces */
interface ILoggerSpy {
  error: jasmine.Spy;
}

/* Note: The Auth0 service must be accessible and operational for these tests */

fdescribe('AuthService', () => {
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

  /* create the service and get test variables */
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

  describe('getAuth0Client', async () => {
    it('should be created', async () => {
      const { authService } = await setup();
      expect(authService).toBeTruthy('service created');
    });

    it('should return an existing instance', async () => {});

    // it('should broadcast authenticated status', async () => {
    //   const { authService } = await setup();

    //   /* stub auth0Client functions */
    //   const dummyAuth0Client: any = {
    //     isAuthenticated: () => 'testTrue',
    //     getUser: () => 'testProfile',
    //     getTokenSilently: () => 'testToken',
    //   };
    //   authService['auth0ClientPromise'] = dummyAuth0Client;

    //   /* run getAuth0Client which sets subjects */
    //   await authService.getAuth0Client();

    //   authService.isAuthenticated.subscribe((isAuthenticated: boolean) => {
    //     expect(isAuthenticated).toBe('testTrue' as any);
    //   });
    // });

    // it('should broadcast profile', async () => {
    //   const { authService } = await setup();

    //   /* stub auth0Client functions */
    //   const dummyAuth0Client: any = {
    //     isAuthenticated: () => true,
    //     getUser: () => 'testProfile',
    //     getTokenSilently: () => 'testToken',
    //   };
    //   authService['auth0ClientPromise'] = dummyAuth0Client;

    //   /* run getAuth0Client which sets subjects */
    //   await authService.getAuth0Client();

    //   authService.profile.subscribe((profile: string) => {
    //     expect(profile).toBe('testProfile');
    //   });
    // });

    // it('should broadcast token', async () => {
    //   const { authService } = await setup();

    //   /* stub auth0Client functions */
    //   const dummyAuth0Client: any = {
    //     isAuthenticated: () => true,
    //     getUser: () => 'testProfile',
    //     getTokenSilently: () => 'testToken',
    //   };
    //   authService['auth0ClientPromise'] = dummyAuth0Client;

    //   /* run getAuth0Client which sets subjects  */
    //   await authService.getAuth0Client();

    //   authService.token.subscribe((token: string) => {
    //     expect(token).toBe('testToken');
    //   });
    // });

    // it('should broadcast profile as null if not authenticated', async () => {
    //   const { authService } = await setup();

    //   /* stub auth0Client functions */
    //   const dummyAuth0Client: any = {
    //     isAuthenticated: () => false,
    //     getUser: () => 'testProfile',
    //     getTokenSilently: () => 'testToken',
    //   };
    //   authService['auth0ClientPromise'] = dummyAuth0Client;

    //   /* run getAuth0Client which sets subjects  */
    //   await authService.getAuth0Client();

    //   authService.profile.subscribe((profile: string) => {
    //     expect(profile).toBeNull();
    //   });
    // });
  });
});
