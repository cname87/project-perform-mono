// export for convenience.
export { ActivatedRoute } from '@angular/router';

/**
 * An ActivatedRoute service stub with a dummy snapshot.
 * A parameter can be set and got.
 * e.g.
 * const route = new ActivatedRouteStub(15)
 * this.route.snapshot.paramMap.get('id') returns 15.
 */
export class ActivatedRouteStub {
  /* set the parameter */
  constructor(private parameter: number | string) {}

  /* dummy snapshot */
  snapshot = {
    paramMap: {
      /* will always return the one parameter */
      get: (_dummy: string) => this.parameter,
    },
  };

  /* set the parameter */
  setParameter(newParameter: number | string) {
    this.parameter = newParameter;
  }
}
