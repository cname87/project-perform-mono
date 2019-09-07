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

  /* holds either the profile of the user logged in or false (or null) */
  isLoggedIn: boolean | null = null;

  /* create a singleton observable of the Auth0 client instance */
  private auth0Client$ = from(this.createAuth0Client(auth0Config)).pipe(
    shareReplay(1),
    catchError((err) => throwError(err)),
  );

  /* called by AuthGuard to check live status */
  public isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap((res) => (this.isLoggedIn = res)),
  );

  private handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback())),
  );

  private userProfileSubject$ = new BehaviorSubject<IUserProfile | null>(null);
  public userProfile$ = this.userProfileSubject$.asObservable();

  /* called to set the userProfile$ observable */
  private getUser$(options?: any): Observable<IUserProfile> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getUser(options))),
      tap((user) => this.userProfileSubject$.next(user)),
    );
  }

  /* called on app initialization - must set userProfile$ and isLoggedIn */
  localAuthSetup() {
    const checkAuth$ = this.isAuthenticated$.pipe(
      /* concatmap ensures getUser observable is subscribed if authenticated */
      concatMap((loggedIn: boolean) => {
        if (loggedIn) {
          /* if authenticated, get user and set userProfile$ */
          return this.getUser$();
        }
        return of(loggedIn);
      }),
    );
    checkAuth$.subscribe((response: { [key: string]: any } | boolean) => {
      this.isLoggedIn = !!response;
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
    let targetRoute: string;
    const authComplete$ = this.handleRedirectCallback$.pipe(
      // Have client, now call method to handle auth callback redirect
      tap((cbRes) => {
        /* set target redirect route from callback results */
        targetRoute =
          cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/';
      }),
      /* concatmap ensures getUser and isAuthenticated$ observables are subscribed */
      concatMap(() => {
        /* set userProfile$ and isLoggedIn status */
        return combineLatest([this.getUser$(), this.isAuthenticated$]);
      }),
    );
    authComplete$.subscribe(([_user, _loggedIn]) => {
      /* redirect to target route */
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
