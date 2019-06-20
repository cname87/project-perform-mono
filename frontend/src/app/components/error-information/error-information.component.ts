import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-error-information',
  templateUrl: './error-information.component.html',
  styleUrls: ['./error-information.component.scss'],
})
export class ErrorInformationComponent implements OnInit {
  /* get the component mode from the query parameter */
  mode = this.route.snapshot.paramMap.get('mode') as string;

  /* default information if no mode passed in, i.e. page not found */
  header = 'Page Not Found';
  hint = 'Click on a tab link above';

  ngOnInit() {
    /* set up error only if a mode query parameter of 'error' is passed in */
    if (this.mode === 'error') {
      /* main information */
      this.header = 'Unexpected Error!';
      /* advice */
      this.hint = 'Click on a tab link above';
    }
  }

  constructor(private route: ActivatedRoute, private location: Location) {}

  goBack() {
    this.location.back();
  }
}
