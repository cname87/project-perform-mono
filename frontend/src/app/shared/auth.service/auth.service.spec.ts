import { APP_BASE_HREF } from '@angular/common';
import { TestBed, getTestBed } from '@angular/core/testing';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { AuthService, CREATE_AUTH0_CLIENT } from './auth.service';
import { auth0Config } from '../../config';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';

fdescribe('AuthService', () => {
  /* set any expected values */
  function createExpected() {
    const loginRedirectDefault = {
      redirect_uri: `${window.location.origin}/callback`,
      appState: { target: '/' },
    };
    const loginRedirectPath = {
      redirect_uri: `${window.location.origin}/callback`,
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

  /* setup function run by each sub test suite*/
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
        Name: 'testName',
        Email: 'testEmail',
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

    /* CREATE_AUTH0_CLIENT is a function called upon service creation (which is created once testbed is created => must declare here */
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
      imports: [AppModule],
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

    const expected = createExpected();

    /* helper function to allow event loop turn */
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

  it('should have localAuthSetUp set isLoggedIn to true', async () => {
    const { authService, sleep } = await setup(true);
    authService.localAuthSetup();
    await sleep(0);
    expect(authService.isLoggedIn).toEqual(true);
  });

  it('should have localAuthSetUp set isLoggedIn to false', async () => {
    const { authService, sleep } = await setup(false);
    authService.localAuthSetup();
    await sleep(0);
    expect(authService.isLoggedIn).toEqual(false);
  });

  it('should have localAuthSetUp cause an error', async () => {
    const { authService } = await setup(true, '', true);
    try {
      await authService['auth0Client$'].toPromise();
      fail('Should not reach this path');
    } catch (err) {
      expect(err).toEqual('testError');
    }
  });

  it('should have isAuthenticated$ return false', async () => {
    const { authService, createAuth0Spy, isAuthenticatedSpy } = await setup(
      false,
    );
    const isLoggedIn = await authService.isAuthenticated$.toPromise();
    expect(isLoggedIn).toEqual(false, 'isLoggedIn false');
    expect(createAuth0Spy).toHaveBeenCalledWith(auth0Config);
    expect(isAuthenticatedSpy).toHaveBeenCalled();
  });

  it('should have isAuthenticated$ return true', async () => {
    const { authService, createAuth0Spy, isAuthenticatedSpy } = await setup(
      true,
    );
    const isLoggedIn = await authService.isAuthenticated$.toPromise();
    expect(isLoggedIn).toBeTruthy('isLoggedIn true');
    expect(createAuth0Spy).toHaveBeenCalledWith(auth0Config);
    expect(isAuthenticatedSpy).toHaveBeenCalled();
  });

  it('should have login call loginWithRedirect with default path', async () => {
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

  it('should have login call loginWithRedirect with path', async () => {
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

  it('should handle auth0 callback', async () => {
    const {
      authService,
      handleRedirectCallbackSpy,
      routerNavigateSpy,
      sleep,
    } = await setup(true, '/testPath');
    authService.handleAuthCallback();
    await sleep(0);
    expect(handleRedirectCallbackSpy).toHaveBeenCalledWith();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/testPath']);
  });

  it('should handle auth0 callback with default path', async () => {
    const {
      authService,
      handleRedirectCallbackSpy,
      routerNavigateSpy,
      sleep,
    } = await setup();
    authService.handleAuthCallback();
    await sleep(0);
    expect(handleRedirectCallbackSpy).toHaveBeenCalledWith();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should have logout call logout', async () => {
    const { authService, logoutSpy, logoutParameter, sleep } = await setup();
    authService.logout();
    await sleep(0);
    expect(logoutSpy).toHaveBeenCalledWith(logoutParameter);
  });

  it('should have getTokenSilently call getTokenSilently', async () => {
    const { authService, getTokenSilentlySpy, sleep } = await setup();
    const token = await authService
      .getTokenSilently$('testParameter')
      .toPromise();
    await sleep(0);
    expect(getTokenSilentlySpy).toHaveBeenCalledWith('testParameter');
    expect(token).toEqual('testToken');
  });
});
