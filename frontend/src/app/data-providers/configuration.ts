import { HttpHeaders } from '@angular/common/http';

/**
 * Configuration object for membersService.
 */

interface IConfigurationParameters {
  basePath: string;
  servicePath: string;
  defaultHeaders: HttpHeaders;
  apiKeys?: { [key: string]: string };
  username?: string;
  password?: string;
  accessToken?: string | (() => string);
  withCredentials?: boolean;
}
class Configuration {
  basePath: string;
  servicePath: string;
  defaultHeaders: HttpHeaders;
  apiKeys?: { [key: string]: string };
  username?: string;
  password?: string;
  accessToken?: string | (() => string);
  /* indicates whether or not cross-site Access-Control requests should be made using credentials -defaults to false */
  withCredentials?: boolean;

  constructor(configurationParameters: IConfigurationParameters) {
    this.basePath = configurationParameters.basePath;
    this.servicePath = configurationParameters.servicePath;
    this.defaultHeaders = configurationParameters.defaultHeaders;
    this.apiKeys = configurationParameters.apiKeys;
    this.username = configurationParameters.username;
    this.password = configurationParameters.password;
    this.accessToken = configurationParameters.accessToken;
    this.withCredentials = configurationParameters.withCredentials;
  }
}

export const membersConfiguration = new Configuration({
  basePath: 'api-v1',
  servicePath: 'members',
  defaultHeaders: new HttpHeaders(),
});
