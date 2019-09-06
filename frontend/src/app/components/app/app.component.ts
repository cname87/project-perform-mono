import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../shared/auth.service/auth.service';

/**
 * This application displays various views of the members of a team stored on a server.  It allows for member creation, reading, updating and deletion.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private logger: NGXLogger, private auth: AuthService) {
    this.logger.trace(`${AppComponent.name}: Starting ${AppComponent.name}`);
  }

  ngOnInit() {
    /* check authentication state */
    this.auth.localAuthSetup();
  }
}
