import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { AuthService } from '../../shared/auth.service/auth.service';

import { routes } from '../../config';

interface ILink {
  path: string;
  display: string;
  disabled?: boolean;
}

/**
 * This component displays a navigation tabbed element.
 */
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  /* is user authenticated */
  public isAuthenticated = false;

  /* routerLink links */
  private dashboard = routes.dashboard;
  private membersList = routes.membersList;
  private detail = routes.detail;
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

  constructor(private logger: NGXLogger, private authService: AuthService) {
    this.logger.trace(`${NavComponent.name}: Starting ${NavComponent.name}`);
  }

  async ngOnInit() {
    /* Watch for changes to the isAuthenticated state */
    this.authService.isAuthenticated.subscribe((value) => {
      this.isAuthenticated = value;
    });
  }

  trackByFn(_index: number, link: ILink): string | null {
    return link ? link.path : null;
  }
}
