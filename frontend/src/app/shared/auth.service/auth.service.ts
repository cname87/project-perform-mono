import { Injectable } from '@angular/core';
import createAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';

import {
  from,
  of,
  Observable,
  BehaviorSubject,
  combineLatest,
  throwError,
} from 'rxjs';
import { tap, catchError, concatMap, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

import { auth0Config, IUserProfile } from '../../config';

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
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router, private logger: NGXLogger) {
    this.logger.trace(`${AuthService.name}: Starting ${AuthService.name}`);
  }

  /* holds either the profile of the user logged in or false (or null) */
  loggedIn: any = null;

  /* create a singleton observable of the Auth0 client instance */
  private auth0Client$ = from(createAuth0Client(auth0Config)).pipe(
    shareReplay(1),
    catchError((err) => throwError(err)),
  );

  /* called by AuthGuard to check live status */
  isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap((res) => (this.loggedIn = res)),
  );

  private handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback())),
  );

  private userProfileSubject$ = new BehaviorSubject<IUserProfile | null>(null);
  userProfile$ = this.userProfileSubject$.asObservable();

  private getUser$(options?: any): Observable<IUserProfile> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getUser(options))),
      tap((user) => this.userProfileSubject$.next(user)),
    );
  }

  localAuthSetup() {
    /* set up local authentication streams */
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (loggedIn) {
          /* if authenticated, get user and set in user profile observable */
          return this.getUser$();
        }
        /* if not authenticated, return stream that emits 'false' */
        return of(loggedIn);
      }),
    );
    checkAuth$.subscribe((response: { [key: string]: any } | boolean) => {
      /* if authenticated, response will be user object */
      /* if not authenticated, response will be 'false' */
      this.loggedIn = !!response;
    });
  }

  login(redirectPath: string = '/') {
    this.auth0Client$.subscribe((client: Auth0Client) => {
      client.loginWithRedirect({
        redirect_uri: `${window.location.origin}/callback`,
        appState: { target: redirectPath },
      });
    });
  }

  handleAuthCallback() {
    /* called when app reloads after user logs in with Auth0 */
    let targetRoute: string; // Path to redirect to after login processsed
    const authComplete$ = this.handleRedirectCallback$.pipe(
      // Have client, now call method to handle auth callback redirect
      tap((cbRes) => {
        /* result has the property appState which was set when calling login in the loginComponent */
        /* if appState was not set then route to the base route */
        targetRoute =
          cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/';
      }),
      concatMap(() => {
        // Redirect callback complete; get user and login status
        return combineLatest([this.getUser$(), this.isAuthenticated$]);
      }),
    );

    /* subscribe to the authentication completion observable*/
    /* the response will be an array of user and login status */
    authComplete$.subscribe(([_user, _loggedIn]) => {
      this.logger.trace(
        `${AuthService.name}: Redirecting following authentication...`,
      );
      this.router.navigate([targetRoute]);
    });
  }

  logout() {
    this.auth0Client$.subscribe((client: Auth0Client) => {
      client.logout({
        client_id: auth0Config.client_id,
        returnTo: `${window.location.origin}`,
      });
    });
  }

  getTokenSilently$(options?: any): Observable<string> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) =>
        from(client.getTokenSilently(options)),
      ),
    );
  }
}
