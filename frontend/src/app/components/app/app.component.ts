import { Component } from '@angular/core';

import { config } from '../../config';
import { NGXLogger } from 'ngx-logger';

interface ILink {
  path: string;
  display: string;
  disabled?: boolean;
}

/**
 * This module displays various views of the members of a team stored on a server.  It allows for member creation, reading, updating and deletion.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  /* main header */
  header = 'Team Members';

  constructor(private logger: NGXLogger) {
    this.logger.trace(AppComponent.name + ': Starting AppComponent');
  }

  /* routerLink links */
  dashboard = config.routes.dashboard;
  membersList = config.routes.membersList;
  detail = config.routes.detail;
  links: ILink[] = [
    {
      path: '/' + this.dashboard.path,
      display: this.dashboard.displayName,
    },
    {
      path: '/' + this.membersList.path,
      display: this.membersList.displayName,
    },
    {
      path: '/' + this.detail.path,
      display: this.detail.displayName,
      disabled: true,
    },
  ];

  trackByFn(_index: number, link: ILink): string | null {
    return link ? link.path : null;
  }
}
