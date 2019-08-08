import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';

import { AuthService } from '../../shared/auth.service/auth.service';
import { auth0Config, routes } from '../../config';

/**
 * This component reads the isAuthenticated status and shows login and logout buttons as appropriate.
 * On clicking login the authentication service is called (which redirects).
 * On clicking logout the authentication service is informed and the application is reloaded.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  header = 'Team Members';
  isAuthenticated = false;
  profile: any;
  private auth0Client!: Auth0Client;

  constructor(private logger: NGXLogger, private authService: AuthService) {
    this.logger.trace(
      `${LoginComponent.name}: Starting ${LoginComponent.name}`,
    );
  }

  async ngOnInit() {
    this.logger.trace(`${LoginComponent.name}: Calling getAuth0Client()`);
    /* get an instance of the Auth0 client */
    this.auth0Client = await this.authService.getAuth0Client();

    /* watch for changes to the isAuthenticated state */
    this.authService.isAuthenticated.subscribe((value) => {
      this.isAuthenticated = value;
    });

    /* watch for changes to the profile data */
    this.authService.profile.subscribe((profile) => {
      this.profile = profile;
    });
  }

  /**
   * Logs in the user by redirecting to Auth0 for authentication.
   * Auth0 calls back to a configured url => reloads page.
   */
  async login() {
    this.logger.trace(LoginComponent.name + ': Logging in...');
    await this.auth0Client.loginWithRedirect({
      /* appState is returned in authorization response */
      /* see CallbackComponent for how target is used to redirect */
      appState: {
        target: routes.loginTarget.path,
      },
    });
  }

  /**
   * Logs the user out of the application, as well as on Auth0
   */
  logout() {
    this.logger.trace(LoginComponent.name + ': Logging out...');
    this.auth0Client.logout({
      client_id: auth0Config.client_id,
      returnTo: window.location.origin,
    });
  }
}
