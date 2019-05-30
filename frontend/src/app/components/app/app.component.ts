import { Component } from '@angular/core';

import { config } from '../../config';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  /* main title */
  header = 'Team Members';

  /* routerLink links */
  dashboard = config.routes.dashboard;
  membersList = config.routes.membersList;
  links = [
    { path: '/' + this.dashboard.path,
      display: this.dashboard.displayName },
    {
      path: '/' + this.membersList.path,
      display: this.membersList.displayName,
    },
  ];

}
