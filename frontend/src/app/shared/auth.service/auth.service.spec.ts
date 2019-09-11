import { APP_BASE_HREF } from '@angular/common';
import { TestBed, getTestBed } from '@angular/core/testing';
import { NGXLogger } from 'ngx-logger';
import { throwError } from 'rxjs';
import { take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { AuthService, CREATE_AUTH0_CLIENT } from './auth.service';
import { auth0Config, routes } from '../../config';

describe('AuthService', () => {
  /* set any expected values */
  function createExpected() {
    const loginRedirectDefault = {
      redirect_uri: `${window.location.origin}${routes.callback.path}`,
      appState: { target: '/' },
    };
    const loginRedirectPath = {
      redirect_uri: `${window.location.origin}${routes.callback.path}`,
      appState: { target: '/testPath' },
    };
    const logoutParameter = {
      client_id: auth0Config.client_id,
      returnTo: `${window.location.origin}`,
    };
    return {
      loginRedirectDefault,
      loginRedirectPath,
      logoutParameter,
    };
  }

  /**
   * @param isAlreadyAuthenticated: Sets the user authenticated status
   * @param redirectPath: appState.target returned from handleRedirectCallback
   * @param createFail: Causes createAuth0Client to throw an error
   */
  async function mainSetup(
    isAlreadyAuthenticated = true,
    redirectPath = '',
    createFail = false,
  ) {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);

    /* stub router.navigate */
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const routerNavigateSpy = routerSpy.navigate.and.stub();

    /* spy on auth0 instance methods */
    const isAuthenticatedSpy = jasmine
      .createSpy('isAuthenticatedSpy')
      .and.callFake(() => Promise.resolve(isAlreadyAuthenticated));
    const handleRedirectCallbackSpy = jasmine
      .createSpy('handleRedirectCallbackSpy')
      .and.callFake(() =>
        Promise.resolve({
          appState: {
            target: redirectPath,
          },
        }),
      );
    const getUserSpy = jasmine.createSpy('getUserSpy').and.callFake(() =>
      Promise.resolve({
        name: 'testName',
        email: 'testEmail',
      }),
    );
    const loginWithRedirectSpy = jasmine
      .createSpy('loginWithRedirectSpy')
      .and.callFake(() => Promise.resolve('loginWithRedirect called'));
    const logoutSpy = jasmine
      .createSpy('logoutSpy')
      .and.callFake(() => Promise.resolve());
    const getTokenSilentlySpy = jasmine
      .createSpy('getTokenSilentlySpy')
      .and.callFake(() => Promise.resolve('testToken'));

    const auth0Spies = {
      isAuthenticatedSpy,
      handleRedirectCallbackSpy,
      getUserSpy,
      loginWithRedirectSpy,
      logoutSpy,
      getTokenSilentlySpy,
    };

    /* CREATE_AUTH0_CLIENT is a function called upon service creation (which is created once the testbed is created => must declare here */
    const mockCreateAuth0Client = createFail
      ? () => throwError('testError')
      : () => {
          const auth0 = {
            isAuthenticated: isAuthenticatedSpy,
            handleRedirectCallback: handleRedirectCallbackSpy,
            getUser: getUserSpy,
            loginWithRedirect: loginWithRedirectSpy,
            logout: logoutSpy,
            getTokenSilently: getTokenSilentlySpy,
          };
          return Promise.resolve(auth0);
        };

    const createAuth0Spy = jasmine
      .createSpy('createAuth0Spy')
      .and.callFake(mockCreateAuth0Client);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: CREATE_AUTH0_CLIENT, useValue: createAuth0Spy },
        { provide: NGXLogger, useValue: loggerSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    /* get the injected instances */
    const testBed = getTestBed();
    const authService = testBed.get(AuthService) as AuthService;

    /* get all expected values */
    const expected = createExpected();

    /* helper function to allow an event loop turn */
    const sleep = (ms: number) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    return {
      authService,
      routerNavigateSpy,
      createAuth0Spy,
      ...auth0Spies,
      ...expected,
      sleep,
    };
  }

  /* setup function run by each it test function */
  async function setup(
    isAlreadyAuthenticated = true,
    redirectPath = '',
    createFail = false,
  ) {
    return mainSetup(isAlreadyAuthenticated, redirectPath, createFail);
  }

  it('should be created', async () => {
    const { authService } = await setup();
    expect(authService).toBeTruthy('service created');
  });

  it('localAuthSetUp sets isLoggedIn to true and set userProfile$ to the user profile', async () => {
    const { authService, sleep } = await setup(true);
    authService.localAuthSetup();
    await sleep(0);
    expect(authService.isLoggedIn).toEqual(true);
    const userProfile = await authService['userProfile$']
      .pipe(take(1))
      .toPromise();
    expect(userProfile!.name).toEqual('testName');
  });

  it('localAuthSetUp sets isLoggedIn to false and not modify userProfile$', async () => {
    const { authService, sleep } = await setup(false);
    expect(authService.isLoggedIn).toBeNull();
    authService.localAuthSetup();
    await sleep(0);
    expect(authService.isLoggedIn).toEqual(false);
    const userProfile = await authService['userProfile$']
      .pipe(take(1))
      .toPromise();
    expect(userProfile).toBeNull();
  });

  it('authClient$ can catch a Auth client creation error', async () => {
    const { authService } = await setup(true, '', true);
    try {
      await authService['auth0Client$'].toPromise();
      fail('Should not reach this path');
    } catch (err) {
      expect(err).toEqual('testError');
    }
  });

  it('login should call loginWithRedirect with the default path', async () => {
    const {
      authService,
      loginWithRedirectSpy,
      loginRedirectDefault,
      sleep,
    } = await setup();
    authService.login();
    await sleep(0);
    expect(loginWithRedirectSpy).toHaveBeenCalledWith(loginRedirectDefault);
  });

  it('login should call loginWithRedirect with a path parameter', async () => {
    const {
      authService,
      loginWithRedirectSpy,
      loginRedirectPath,
      sleep,
    } = await setup();
    authService.login(loginRedirectPath.appState.target);
    await sleep(0);
    expect(loginWithRedirectSpy).toHaveBeenCalledWith(loginRedirectPath);
  });

  it('handleRedirectCallback should route to a returned path and set isLoggedIn to true and userProfile$ to the user profile', async () => {
    const {
      authService,
      handleRedirectCallbackSpy,
      routerNavigateSpy,
      sleep,
    } = await setup(true, '/testPath'); // pass path to be retuned
    authService.handleAuthCallback();
    await sleep(0);
    expect(handleRedirectCallbackSpy).toHaveBeenCalledWith();
    expect(authService.isLoggedIn).toEqual(true);
    const userProfile = await authService['userProfile$']
      .pipe(take(1))
      .toPromise();
    expect(userProfile!.name).toEqual('testName');
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/testPath']);
  });

  it('handleRedirectCallback should route to the default path and set isLoggedIn to true and userProfile$ to the user profile', async () => {
    const {
      authService,
      handleRedirectCallbackSpy,
      routerNavigateSpy,
      sleep,
    } = await setup();
    authService.handleAuthCallback();
    await sleep(0);
    expect(handleRedirectCallbackSpy).toHaveBeenCalledWith();
    const userProfile = await authService['userProfile$']
      .pipe(take(1))
      .toPromise();
    expect(userProfile!.name).toEqual('testName');
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('logout should call Auth0 client logout with configured parameter', async () => {
    const { authService, logoutSpy, logoutParameter, sleep } = await setup();
    authService.logout();
    await sleep(0);
    expect(logoutSpy).toHaveBeenCalledWith(logoutParameter);
  });

  it('getTokenSilently should call Auth0 client with an options parameter and return the token from the client', async () => {
    const { authService, getTokenSilentlySpy, sleep } = await setup();
    const token = await authService
      .getTokenSilently$('testParameter')
      .toPromise();
    await sleep(0);
    expect(getTokenSilentlySpy).toHaveBeenCalledWith('testParameter');
    expect(token).toEqual('testToken');
  });
});
