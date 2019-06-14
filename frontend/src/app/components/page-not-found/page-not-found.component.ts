import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
})
export class PageNotFoundComponent implements OnInit {
  /* not found header */
  header = 'Page Not Found';
  /* not found advice */
  hint = 'Click on a tab link above';

  constructor() {}

  ngOnInit() {}
}
