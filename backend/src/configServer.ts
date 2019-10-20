/**
 * This module sets all configuration parameters for the http server.
 */

/* external dependencies */
import appRootObject from 'app-root-path';
const appRoot = appRootObject.toString();
import path from 'path';

// tslint:disable:object-literal-sort-keys
export const configServer = {
  /**
   * This section sets misc configuration parameters used by the
   * application programme.
   */

  /* time for which a database ping is awaited */
  DB_PING_TIME: 1500,
  /* the path to the directory containing Angular files to be set up a static directory */
  CLIENT_APP_PATH: path.join(appRoot, 'frontend', 'dist'),

  /**
   * The server can be hosted remotely or locally:
   * The GCP host requires a http server listening on process.env.PORT which is set by the GCP host.
   * The PORT parameter below is only used if process.env.PORT is not set by the GCP host, i.e. for a local environment.  Although not strictLy necessary, it is set to the known value used by the GCP host.
   */
  PORT: 8080,
  /* host is needed for test files */
  get HOST() {
    return `http://localhost:${this.PORT}/`;
  },
  /* number of times a server will attempt to listen on an occupied port a number from 0 to 10 */
  SVR_LISTEN_TRIES: 3,
  /* time between retries in seconds a number between 1 to 10 */
  SVR_LISTEN_TIMEOUT: 3,
  // path to static server for server tests
  STATIC_TEST_PATH: path.join(
    appRoot,
    'backend',
    'src',
    'test',
    'client-static',
  ),
  NODE_MODULES_PATH: path.join(appRoot, 'node_modules'),

  /**
   * This section sets all configuration parameters for the API middleware.
   */
  /* base path for all calls to the api */
  API_BASE_PATH: '/api-v1',
  OPENAPI_FILE: path.join(appRoot, 'backend', 'api', 'openapi.json'),
};
