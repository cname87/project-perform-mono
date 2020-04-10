import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../shared/auth.service/auth.service';

/**
 * This module gets the user profile from the authentication server.
 */

@Component({
  selector: 'app-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class ProfileComponent {
  constructor(
    private auth: AuthService,
    private location: Location,
    private logger: NGXLogger,
  ) {
    this.logger.trace(`${ProfileComponent.name}: Starting ProfileComponent`);
  }

  get userProfile$() {
    return this.auth.userProfile$;
  }

  goBack() {
    this.location.back();
  }
}
