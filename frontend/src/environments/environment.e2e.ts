import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  production: false,
  e2eTesting: true,
  /* console logging level */
  logLevel: NgxLoggerLevel.TRACE,
  /* server logging level */
  serverLogLevel: NgxLoggerLevel.ERROR,
  /* server logs go to this url */
  apiUrl: 'http://localhost:1337/',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact on performance if an error is thrown.
 */
import 'zone.js/dist/zone-error'; // Included with Angular CLI.
