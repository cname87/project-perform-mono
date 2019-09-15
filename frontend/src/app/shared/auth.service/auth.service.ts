import { Injectable, InjectionToken, Inject } from '@angular/core';
import originalCreateAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';

import {
  from,
  Observable,
  BehaviorSubject,
  throwError,
  combineLatest,
  of,
} from 'rxjs';
import { tap, catchError, concatMap, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

import { auth0Config, IUserProfile, routes } from '../../config';

/**
 * Auth0 Operation:
 * ---------------
 * 1. An AuthService instance is created which creates...
 * - A public observable to share the user authenticated status.
 * - Public methods to get the user profile, login, handle the login call back, & logout.
 * 2. app.component ngOnInit calls authService.localAuthSetup().
 * - This results in a call to getAuth0Client() creating a singleton Auth0Client instance, and checks if the user is authenticated and sets the public variable, isLogged, to either false or to the logged-in user profile.
 *
 * 3. If the login prompt is clicked then the Auth0 client instance loginWithRedirect() function is called which calls the Auth0 server which redirects to the CallbackComponent, which opens a configured page (dashboard).
 * - The Auth0 server sends a cookie to the client which sets up a session in the client - the client can determine that the user is logged in without having to contact the server. Thus if a browser if closed and reopened the user is not required to re-enter a password.
 * - The Auth0 client sends a token which can be used to authorize access to a backend API.
 * - The backend server confirms the token with the Auth0 server which sends back the relevant user information, including the configured scopes, to the server. (The token is unique to each user).
 * - See https://auth0.com/docs/flows/concepts/implicit for the authorization flow.  Note that server can also authenticate via the Auth0 server using a client-credentials flow.
 * 4. The isLogged status sets the views E.g. the logout button shows when isLogged is true.
 * 5. On clicking logout the authentication service is informed and the application is reloaded.
 */

/* inject auth0-spa-js create auth0 client instance function via DI for ease of testing */
type TCreateAuth0Client = (options: Auth0ClientOptions) => Promise<Auth0Client>;
export const CREATE_AUTH0_CLIENT = new InjectionToken<TCreateAuth0Client>(
  'createAuth0Client',
  {
    providedIn: 'root',
    factory: () => originalCreateAuth0Client,
  },
);

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private router: Router,
    private logger: NGXLogger,
    @Inject(CREATE_AUTH0_CLIENT) private createAuth0Client: TCreateAuth0Client,
  ) {
    this.logger.trace(`${AuthService.name}: Starting ${AuthService.name}`);
  }

  /**
   * Holds the user authentication status:
   * - true if the user has logged in
   * - false if the user is not logged in (or the login has expired)
   */
  public isLoggedIn: boolean | null = null;

  /* create a singleton observable of the Auth0 client instance */
  private auth0Client$ = from(this.createAuth0Client(auth0Config)).pipe(
    shareReplay(1),
    catchError((err) => throwError(err)),
  );

  /**
   * Calls Auth0 client instance to check whether the user has logged in and been authenticated.  Sets isLoggedIn to the result.
   * Note: Called by AuthGuard to check status, i.e. when the login expires AuthGuard will direct to the login page.
   */
  public isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap((res) => (this.isLoggedIn = res)),
  );

  /* calls auth0 client handleRedirectCallback instance */
  private handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback())),
  );

  /**
   * Broadcasts the user profile to all subscribers.
   * Note: getUser$ must be called during set up to make the user profile available in userProfile$.
   */
  /* behaviour subject sends last emitted value to new subscribers and also send new emitted values to all subscribers */
  private userProfileSubject$ = new BehaviorSubject<IUserProfile | null>(null);
  public userProfile$ = this.userProfileSubject$.asObservable();

  /* called to set the userProfile$ observable */
  private getUser$ = (options?: any): Observable<IUserProfile> => {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getUser(options))),
      tap((user) => this.userProfileSubject$.next(user)),
    );
  };

  /**
   * Sets isLoggedIn to true if user is authenticated, otherwise it sets isLoggedIn to false.
   * Sets userProfile$ to the user profile if user is authenticated, otherwise it does not modify userProfile$.
   * Note: Called on app initialization only.
   */
  public localAuthSetup = () => {
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (loggedIn) {
          /* Note: concatMap with return ensures that the getUser observable is subscribed */
          return this.getUser$();
        } else {
          return of(false);
        }
      }),
    );
    checkAuth$.subscribe((response: { [key: string]: any } | boolean) => {
      this.isLoggedIn = !!response;
    });
  };

  /**
   * Calls the Auth0 client instance loginWithDirect function.  The function is called with an object parameter that sets the redirect uri to the callback component and also an appState property passed to the callback component used to set the target route to which the app is ultimately sent.
   * @param redirectPath: The target redirect path supplied to the Auth loginWithRedirect function.  It defaults to /, i.e. the app is ultimately redirected to the home page.
   */
  public login = (redirectPath: string = '/') => {
    this.auth0Client$.subscribe((client: Auth0Client) => {
      client.loginWithRedirect({
        redirect_uri: `${window.location.origin}${routes.callback.path}`,
        appState: { target: redirectPath },
      });
    });
  };

  /**
   * Causes the Auth0 client instance handleRedirectCallback function to be called, sets userProfile$ and isLoggedIn, and navigates to the target route.
   * The handleRedirectCallback function returned object should include an appState object containing a target property holding the target route.  If it does not then the target route is set to /.
   *
   * Note: Called when app reloads after the Auth0 server redirects after the user is authenticated.
   */
  public handleAuthCallback = () => {
    let targetRoute: string;
    const authComplete$ = this.handleRedirectCallback$.pipe(
      tap((cbRes) => {
        /* set target route from callback results */
        targetRoute =
          cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/';
      }),
      /* concatMap return ensures getUser$ and isAuthenticated$ observables are subscribed */
      concatMap(() => {
        return combineLatest([this.getUser$(), this.isAuthenticated$]);
      }),
    );
    authComplete$.subscribe(([_user, _loggedIn]) => {
      this.router.navigate([targetRoute]);
    });
  };
  /**
   * Calls the Auth0 client instance logout function.
   * The logout function is called with an object containing the configured Auth0 application client ID and a returnTo property set to the app uri origin.
   */
  public logout = () => {
    this.auth0Client$.subscribe((client: Auth0Client) => {
      client.logout({
        client_id: auth0Config.client_id,
        returnTo: `${window.location.origin}`,
      });
    });
  };

  /**
   * Calls the Auth0 client instance getTokenSilently function with a supplied options parameter and rteurns the received token as an observable..
   * @param options: Parameter to be supplied to the Auth0 function - see documentation.  Optional and not currently used.
   */
  public getTokenSilently$ = (options?: any): Observable<string> => {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) =>
        from(client.getTokenSilently(options)),
      ),
    );
  };
}
