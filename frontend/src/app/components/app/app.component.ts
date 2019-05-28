import { Component } from '@angular/core';

import { config } from '../../config';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { MembersListComponent } from '../members-list/members-list.component';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  /* main title */
  title = 'Team Members';
  child = '';

  /* component routing elements */
  dashboard = config.routes.dashboard;
  members = config.routes.members;

  onActivate(componentRef: any) {
    if (componentRef instanceof DashboardComponent) {
      this.child = 'dashboard';
    } else if (componentRef instanceof MembersListComponent) {
      this.child = 'membersList';
    } else {
      this.child = '';
    }
  }
}
