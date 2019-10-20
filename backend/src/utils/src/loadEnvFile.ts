/**
 * Utility to import the .env file into process.env.
 * This should be called as the first line to set configuration parameters before they might be needed.
 * The .env files must be called .envDevelopment and .envProduction and must be in a subdirectory of the app root (i.e. the folder containing the node_modules folder that contains the package 'app-root-path) called 'backend'.
 * Which .env file imported is dependent on the value of process.env.NODE_ENV
 * Note that the GCP server sets NODE_ENV to 'production' but otherwise it is undefined unless set as a command line parameter (or otherwise before this file is called).
 * If NODE_ENV === 'production' then key parameters are checked and warnings are printed if they are nit set to match a final production set up.
 */
import dotenv from 'dotenv';
import { join } from 'path';
import appRootObject from 'app-root-path';
const appRoot = appRootObject.toString();
const envPath =
  process.env.NODE_ENV === 'production'
    ? join(appRoot, 'backend', '.envProduction')
    : join(appRoot, 'backend', '.envDevelopment');
dotenv.config({ path: envPath });

import { setupDebug } from '../../utils/src/debugOutput';
setupDebug(__filename);

/* warn when in production on key parameters */
if (process.env.NODE_ENV === 'production') {
  if (process.env.DEBUG) {
    console.warn('*** NOTE: DEBUG parameter is set');
  }
  if (process.env.GAE_DEBUG) {
    console.warn('*** NOTE: GAE_DEBUG parameter is set');
  }
  if (process.env.TEST_PATHS) {
    console.warn('*** NOTE: TEST_PATHS parameter is set');
  }
  if (process.env.DB_MODE === 'production') {
    console.warn('*** NOTE: Production database is use');
  }
}
