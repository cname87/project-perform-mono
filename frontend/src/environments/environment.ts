// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { NgxLoggerLevel } from 'ngx-logger';

/* For easier debugging in development mode, you can import the following file to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.

 This import should be commented out in production mode because it will have a negative impact on performance if an error is thrown.
 */
import 'zone.js/dist/zone-error';

export const environment = {
  /* enables production mode if true */
  production: false,

  /* allows e2e error anc cache tests be run */
  e2eTesting: false,

  /* console logging level */
  logLevel: NgxLoggerLevel.TRACE,

  /* sets audience which is the unique identifier to the OAuth API - note that the reference to https://localhost:8080 is not relevant but cannot be changed */
  get apiUrl(): string {
    return 'https://localhost:8080/api-v1/';
  },
}; // Included with Angular CLI.
