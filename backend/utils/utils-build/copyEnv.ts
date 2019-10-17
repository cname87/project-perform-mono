/**
 * Utility to copy .env files to the dist directory.
 *
 * Usage:
 * Used in package.com.
 * The directory containing the .env files is passed in as a parameter.
 * The .env files to be copied must exits and must be named .envDevelopment & .envProduction
 * The dist directory is passed in as a parameter.
 * package.com script: "npm run copyEnv.ts <pathToEnvFiles> <pathToDistDir>".
 *
 * Both paths must be relative to the directory that the node_modules directory (that contains the package 'app-root-path') is in.
 *
 * <pathToDistDir> must end in /dist.
 *
 */

import appRootObject from 'app-root-path';
import fs = require('fs');
import path = require('path');
import shell = require('shelljs');

const appRoot = appRootObject.toString();

/* create paths to the .env files */
const envDevelopmentPath = path.join(
  appRoot,
  process.argv[2],
  '.envDevelopment',
);
const envProductionPath = path.join(appRoot, process.argv[2], '.envProduction');

/* create path to dist directory from passed in parameter */
const distPath = path.join(appRoot, process.argv[3]);

/* create path to the created files */
const envDevelopmentPathDist = path.join(distPath, '.envDevelopment');
const envProductionPathDist = path.join(distPath, '.envProduction');

if (!fs.existsSync(envDevelopmentPath) || !fs.existsSync(envProductionPath)) {
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

shell.cp(envDevelopmentPath, distPath);
shell.cp(envProductionPath, distPath);

if (
  !fs.existsSync(envDevelopmentPathDist) ||
  !fs.existsSync(envProductionPathDist)
) {
  console.error('ERROR: env file not found in /dist');
  process.exit(1);
}
