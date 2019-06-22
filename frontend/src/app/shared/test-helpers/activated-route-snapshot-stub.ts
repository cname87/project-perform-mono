// export for convenience.
export { ActivatedRoute } from '@angular/router';

/**
 * An ActivatedRoute test double with a dummy snapshot.
 * A parameter can be set and got.
 * e.g.
 * const route = new ActivatedRouteStub(15)
 * this.route.snapshot.paramMap.get('id') returns 15.
 */
export class ActivatedRouteStub {
  /* default parameter is 0 */
  constructor(public id: number | string) {}

  /* dummy snapshot */
  snapshot = {
    paramMap: {
      get: () => this.id,
    },
  };

  /* set id parameter */
  setId(idNew: number | string) {
    this.id = idNew;
  }
}
