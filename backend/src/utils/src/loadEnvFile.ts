/**
 * Utility to import the .env file into process.env.
 * This should be called as the first line to set configuration parameters before they might be needed.
 * The .env files must be called .envDevelopment, .envProduction & .envStaging, and must be in a directory pwd/backend.
 * Which .env file imported is dependent on the value of process.env.NODE_ENV
 * Note that the GCP production server sets NODE_ENV to 'production', and the GCP Build configuration file sets NODE_ENV to 'staging', but otherwise it is undefined (unless otherwise set as a command line parameter, or otherwise set before this file is called).
 * If NODE_ENV === 'staging' then it is set to 'production' in this module;
 * If NODE_ENV === 'production' (or 'staging') then key parameters are checked and warnings are printed if they are not set to match a final production set up.
 */
import dotenv from 'dotenv';
import findup from 'find-up';

let envPath: string;
switch (process.env.NODE_ENV) {
  case 'production': {
    envPath = findup.sync('.envProduction', { cwd: __dirname })!;
    break;
  }
  case 'staging': {
    envPath = findup.sync('.envStaging', { cwd: __dirname })!;
    process.env.NODE_ENV = 'production';
    break;
  }
  default: {
    envPath = findup.sync('.envDevelopment', { cwd: __dirname })!;
    break;
  }
}

dotenv.config({ path: envPath });

/* set up debug function after DEBUG variable is set */
import { setupDebug } from './debugOutput';

/* output a header */
setupDebug(__filename);

/* test that DB_HOST has been set, and abort if not */
if (!process.env.DB_HOST) {
  console.error('An .env file was not imported => aborting startup');
  throw new Error('An .env file was not imported => aborting startup');
}

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
    console.warn('*** NOTE: Production database in use');
  }
}
