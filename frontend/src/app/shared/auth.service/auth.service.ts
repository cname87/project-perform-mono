import { Injectable } from '@angular/core';
import createAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { BehaviorSubject } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

import { auth0Config } from '../../config';

/**
 * This service gets the auth0 client instance (once) and
 * provides auth0.isAuthenticated and the user profile via a subject.
 * See the LoginComponent for how the auth0 authentication works.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /* current value stored for retrieval on subscribing*/
  isAuthenticated = new BehaviorSubject(false);
  /* user profile */
  profile = new BehaviorSubject<any>(null);
  token = new BehaviorSubject<any>(null);

  private auth0Client!: Auth0Client;
  private auth0ClientPromise!: Promise<Auth0Client>;

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${AuthService.name}: Starting ${AuthService.name}`);
  }

  /**
   * Gets the auth0 client instance once, and once only.
   * Provides isAuthenticated for the public subject.
   * Note that a 2nd component may call this method as the promise in it is being awaited which means two calls to the promise might be made.  createAuth0Client() appears to throw an error if it is called twice which means we cannot await createAuth0Client.
   */
  async getAuth0Client(): Promise<Auth0Client> {
    this.logger.trace(`${AuthService.name}: Running getAuthClient()`);

    /* if instance exists then skip and just return it */
    if (!this.auth0Client) {
      /* if createAuth0Client has not being called, call it */
      if (!this.auth0ClientPromise) {
        this.logger.trace(`${AuthService.name}: Creating the Auth0 client`);
        this.auth0ClientPromise = createAuth0Client(auth0Config);
      }

      /* await resolution of the promise */
      this.auth0Client = await this.auth0ClientPromise;

      /* provide the current value of isAuthenticated */
      this.isAuthenticated.next(await this.auth0Client.isAuthenticated());

      /* provide the user profile */
      this.isAuthenticated.subscribe(async (isAuthenticated) => {
        /* whenever isAuthenticated is set, provide the current value of `getUser` as the profile */
        if (isAuthenticated) {
          this.profile.next(await this.auth0Client.getUser());
          this.token.next(await this.auth0Client.getTokenSilently());
          return;
        }
        /* whenever isAuthenticated is unset, provide null as the profile */
        this.profile.next(null);
      });
    }

    return this.auth0Client;
  }
}
