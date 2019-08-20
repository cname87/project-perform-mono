import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../shared/auth.service/auth.service';

/**
 * This component displays key error information along with advice to the user to click on a tab to restart. It is routed to by the error handler after an error is thrown.
 * The default information displayed shows 'page not found'.
 * If a mode of 'error' is passed in via a url query parameter the information shown is relevant to an unexpected error.
 */
@Component({
  selector: 'app-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.scss'],
})
export class InformationComponent implements OnInit {
  /* component mode determines text and prompts */
  private mode = '';

  /* default information if no mode passed in, i.e. page not found */
  header = '';
  /* advice */
  hint = '';
  /* go back button */
  isGoBackVisible = false;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private authService: AuthService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      InformationComponent.name + ': Starting InformationComponent',
    );
  }

  async ngOnInit(): Promise<void> {
    /* get the component mode from the query parameter */
    this.mode = this.route.snapshot.paramMap.get('mode') as string;
    /* set up error only if a mode query parameter of 'error' is passed in */
    if (this.mode === 'error') {
      /* main information */
      this.header = 'Unexpected Error!';
      this.hint = 'Click on a tab link above';
      this.isGoBackVisible = true;
    } else if (this.mode === 'login') {
      /* set up log in only if a mode query parameter of 'login' is passed in */
      let isAuthenticated = false;
      this.authService.isAuthenticated.subscribe((value) => {
        isAuthenticated = value;
        this.header = isAuthenticated ? 'Log Out' : 'Log In';
        this.hint = isAuthenticated
          ? 'Click on the log out button above (or click on a tab link above to return)'
          : 'Click on the Log In button above';
        this.isGoBackVisible = false;
      });

      /* else set up the page not found */
    } else {
      this.header = 'Page Not Found';
      this.hint = 'Click on a tab link above';
      this.isGoBackVisible = true;
    }
  }

  goBack(): void {
    this.location.back();
  }
}
