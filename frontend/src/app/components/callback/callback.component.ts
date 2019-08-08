import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/auth.service/auth.service';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

import { routes } from '../../config';

/**
 * Following authentication, auth0 calls a configured url which routes to this component, i.e. the application is reloaded (and the authService reports isAuthenticated is true when it gets the auth0Client as authentication has occurred).  This component then calls the route configured in the login component call to loginWithRedirect().
 */

@Component({
  selector: 'app-callback',
  template: '',
})
export class CallbackComponent implements OnInit {
  constructor(
    private logger: NGXLogger,
    private authService: AuthService,
    private router: Router,
  ) {
    this.logger.trace(
      `${CallbackComponent.name}: Starting ${CallbackComponent.name}`,
    );
  }

  async ngOnInit() {
    this.logger.trace(`${CallbackComponent.name}: Calling getAuth0Client()`);

    const client = await this.authService.getAuth0Client();
    /* catch errors such as the user manually entering /callback */
    try {
      /* handle success and error responses from Auth0 */
      const result = await client.handleRedirectCallback();
      /* result has the property appState which was set when calling login in the loginComponent */
      /* if appState was not set then route to the base route */
      const targetRoute =
        result.appState && result.appState.target ? result.appState.target : '';

      /* update observables */
      this.authService.isAuthenticated.next(await client.isAuthenticated());
      this.authService.profile.next(await client.getUser());

      this.logger.trace(
        `${CallbackComponent.name}: Redirecting following authentication...`,
      );
      /* redirects to the route as set in the call in the login component */
      this.router.navigate([targetRoute]);
    } catch {
      this.logger.error(
        `${CallbackComponent.name}: Error handling redirect callback`,
      );
      /* redirects to login page */
      this.router.navigate([routes.loginTarget.path]);
    }
  }
}
