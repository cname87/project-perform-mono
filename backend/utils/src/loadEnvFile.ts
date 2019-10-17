/**
 * Utility to import the .env file into process.env.
 * This should be called as the first line to set configuration parameters before they might be needed.
 * The .env files must be called .envDevelopment and .envProduction and must be in a subdirectory of the app root (i.e. the folder containing the node_modules folder that contains the package 'app-root-path) called 'backend'.
 * Which .env file imported is dependent on the value of process.env.NODE_ENV
 * Note that the GCP server sets NODE_ENV to 'production' but otherwise it is undefined unless set as a command line parameter (or otherwise before this file is called).
 */
import dotenv = require('dotenv');
import path = require('path');
import appRootObject from 'app-root-path';
const appRoot = appRootObject.toString();
const envPath =
  process.env.NODE_ENV === 'production'
    ? path.join(appRoot, 'backend', '.envProduction')
    : path.join(appRoot, 'backend', '.envDevelopment');
dotenv.config({ path: envPath });

const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* print key .env parameters */
debug(modulename + ': NODE_ENV: ' + process.env.NODE_ENV);
