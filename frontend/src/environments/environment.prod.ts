import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  production: true,
  e2eTesting: false,
  /* console logging level */
  logLevel: NgxLoggerLevel.OFF,
  /* GCP port must be 8080 */
  PORT: 8080,
  /* server logs go to this url */
  get apiUrl() {
    return `https://localhost:${this.PORT}/api-v1/`;
  },
};
