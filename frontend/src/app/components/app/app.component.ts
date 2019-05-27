import { Component } from '@angular/core';

import { config } from '../../config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  /* main title */
  title = 'Team Members';

  /* component routing elements */
  dashboard = config.routes.dashboard;
  members = config.routes.members;
}
