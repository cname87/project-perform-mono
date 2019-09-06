import { Component } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../shared/auth.service/auth.service';

/**
 * This module provides log in and out functionality.
 * The login button returns the Auth0 page for user authentication.
 * The logout button returns app to the initial logged out state.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  header = 'Team Members';

  constructor(private logger: NGXLogger, public auth: AuthService) {
    this.logger.trace(
      `${LoginComponent.name}: Starting ${LoginComponent.name}`,
    );
  }
}
