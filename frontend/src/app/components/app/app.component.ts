import { Component } from '@angular/core';

import { config } from '../../config';

interface ILink {
  path: string;
  display: string;
  disabled?: boolean;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  /* main header */
  header = 'Team Members';

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

  trackByFn(_index: number, link: ILink) {
    return link ? link.path : null;
  }
}
