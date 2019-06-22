import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

/**
 * This component displays key error information along with advice to the user to click on a tab to restart. It is routed to by the error handler after an error is thrown.
 * The default information displayed shows 'page not found'. If a mode of 'error' is passed in via a url query parameterthe information is suited to an unexpected error.
 */
@Component({
  selector: 'app-error-information',
  templateUrl: './error-information.component.html',
  styleUrls: ['./error-information.component.scss'],
})
export class ErrorInformationComponent implements OnInit {
  /* component mode determines text and prompts */
  private mode = '';

  /* default information if no mode passed in, i.e. page not found */
  header = 'Page Not Found';
  hint = 'Click on a tab link above';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      ErrorInformationComponent.name + ': Starting ErrorInformationComponent',
    );
  }

  ngOnInit(): void {
    /* get the component mode from the query parameter */
    this.mode = this.route.snapshot.paramMap.get('mode') as string;
    /* set up error only if a mode query parameter of 'error' is passed in */
    if (this.mode === 'error') {
      /* main information */
      this.header = 'Unexpected Error!';
      /* advice */
      this.hint = 'Click on a tab link above';
    }
  }

  goBack(): void {
    this.location.back();
  }
}
