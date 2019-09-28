import { of } from 'rxjs';
import { members } from '../mocks/mock-members';

// export for convenience.
export { ActivatedRoute } from '@angular/router';

/**
 * An ActivatedRoute service stub with a dummy snapshot.
 * A parameter can be set and got.
 * e.g.
 * const route = new ActivatedRouteStub(15)
 * this.route.snapshot.paramMap.get('id') returns 15.
 * It also has a 'data' property to mock route data returned via a route resolver.
 */
export class ActivatedRouteStub {
  /* set the parameter - default to 9 */
  constructor(private parameter: number | string = '2') {}

  member = members[this.parameter];

  /* dummy snapshot */
  snapshot = {
    paramMap: {
      /* will always return the one parameter */
      get: (_dummy: string) => this.parameter,
    },
  };

  /* mocks the route 'data' property where data is placed during route resolution */
  data = of({
    members,
    member: this.member,
  });

  /* set the parameter */
  setParameter(newParameter: number | string) {
    this.parameter = newParameter;
  }
}
