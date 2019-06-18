import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-error-warning',
  templateUrl: './error-warning.component.html',
  styleUrls: ['./error-warning.component.scss'],
})
export class ErrorInformationComponent {

  /* not found header */
  header = 'Page Not Found';
  /* not found advice */
  hint = 'Click on a tab link above';

  /* mode for input box */
  @Input() mode = 'notFound';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  goBack() {
    this.location.back();
  }

}
