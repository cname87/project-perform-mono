import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';

import { AuthService } from '../../shared/auth.service/auth.service';

interface IProfile {
  name: string;
  email: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private location: Location,
    private logger: NGXLogger,
  ) {
    this.logger.trace(ProfileComponent.name + ': Starting ProfileComponent');
  }

  profile$: Observable<IProfile> = null as any;

  ngOnInit() {
    /* get the profile via the authService */
    this.profile$ = this.authService.profile;
  }

  goBack() {
    this.location.back();
  }
}
