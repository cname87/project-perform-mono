import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../shared/auth.service/auth.service';

/**
 * Following authentication, auth0 calls a configured url which routes to this component, i.e. the application is reloaded (and the authService reports isAuthenticated is true when it checks with the Auth0 server (as a cookie is passed with the token).  This component then calls a handler which redirects to a configured page.
 */

@Component({
  selector: 'app-callback',
  template: '',
})
export class CallbackComponent implements OnInit {
  constructor(private logger: NGXLogger, private auth: AuthService) {
    this.logger.trace(
      `${CallbackComponent.name}: Starting ${CallbackComponent.name}`,
    );
  }

  ngOnInit() {
    this.logger.trace(
      `${CallbackComponent.name}: Calling authentication callback handler`,
    );
    /* note: the url state query parameter is queried directly by the auth0 client instance handleRedirectCallback function */
    this.auth.handleAuthCallback();
  }
}
