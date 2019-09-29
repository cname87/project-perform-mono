import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  /* default to production */
  production: true,
  /* used to inform error testing interceptor */
  e2eTesting: true,
  /* console logging level OFF - same as production setting */
  /* change to TRACE for debug only */
  logLevel: NgxLoggerLevel.OFF,
  /* GCP port must be 8080 */
  PORT: 8080,
  /* server logs go to this url */
  get apiUrl() {
    return `https://localhost:${this.PORT}/api-v1/`;
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact on performance if an error is thrown.
 */
/* leave commented out by default to simulate production */
// import 'zone.js/dist/zone-error'; // Included with Angular CLI.
