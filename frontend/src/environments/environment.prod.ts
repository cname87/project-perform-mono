import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  production: true,
  e2eTesting: false,
  /* console logging level */
  logLevel: NgxLoggerLevel.OFF,
  /* server logging level */
  serverLogLevel: NgxLoggerLevel.ERROR,
  /* server logs go to this url root */
  apiUrl: 'http://localhost:1337/',
};
