import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  /* allows build optimization - must be true */
  production: true,
  /* allows cache and error testing - must be false */
  e2eTesting: false,
  /* console logging level - must be OFF */
  /* change to TRACE for debug only */
  logLevel: NgxLoggerLevel.OFF,
  /* sets audience which is the unique identifier to the OAuth API - note that the reference to https://localhost:8080 is not relevant but cannot be changed */
  get apiUrl(): string {
    return 'https://localhost:8080/api-v1/';
  },
};
