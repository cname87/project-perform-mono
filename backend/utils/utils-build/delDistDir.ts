/**
 * * Utility to delete a dist directory *
 *
 * * Usage:
 *
 * Used in package.com.
 *
 * The dist directory to be deleted is passed in as a parameter.
 * package.com script: "npm run delDistDir.ts <pathToDistDir>".
 *
 * <pathToDistDir> is relative to the directory that the node_modules directory (that contains the package 'app-root-path') is in.
 *
 * <pathToDistDir> must end in /dist/.
 *
 */

import appRootObject from 'app-root-path';
import fs = require('fs');
import path = require('path');
import rimraf = require('rimraf');

const appRoot = appRootObject.toString();

/* confirm that the passed in path ends in /dist/ */
if (process.argv[2].slice(-6) !== '/dist/') {
  console.error('ERROR: dist directory not provided');
  process.exit(1);
}

/* create path to dist directory from passed in parameter */
const distPath = path.join(appRoot, process.argv[2]);
console.log(`Deleting: ${distPath}`);

if (!fs.existsSync(distPath)) {
  console.error('WARNING: dist directory not found');
}

rimraf.sync(distPath);

if (fs.existsSync(distPath)) {
  console.error('ERROR: dist directory not deleted');
  process.exit(1);
}
