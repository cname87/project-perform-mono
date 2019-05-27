/**
 * Utility to copy the .env file to the dist directory.
 *
 * Usage:
 * Used in package.com.
 * The directory containing the .env file is passed in as a parameter.
 * The dist directory is passed in as a parameter.
 * package.com script: "npm run copyEnv.ts <pathToEnvFile> <pathToDistDir>".
 *
 * Both paths are relative to the package.json directory.
 *
 * <pathToDistDir> must end in /dist.
 *
 */

import appRootObject from 'app-root-path';
import fs = require('fs');
import path = require('path');
import shell = require('shelljs');

const appRoot = appRootObject.toString();

/* create path to the .env file */
const envPath = path.join(appRoot, process.argv[2], '.env');

/* create path to dist directory from passed in parameter */
const distPath = path.join(appRoot, process.argv[3]);

/* create path to the created file */
const envPathDist = path.join(distPath, '.env');

if (!fs.existsSync(envPath)) {
  console.error('ERROR: env file not found');
  process.exit(1);
}

if (process.argv[3].slice(-5) !== '/dist') {
  console.error('dist directory not provided');
  process.exit(1);
}

if (!fs.existsSync(distPath)) {
  console.error('ERROR: dist directory not found');
  process.exit(1);
}

shell.cp(envPath, distPath);

if (!fs.existsSync(envPathDist)) {
  console.error('ERROR: env file not found in /dist');
  process.exit(1);
}
