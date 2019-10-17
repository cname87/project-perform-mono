/**
 * Utility used to copy files in static folders to the dist directory.
 *
 * Usage:
 * Used in package.com.
 * The source directory containing the static files is passed in as the first parameter.
 * The parent directory where you want the directory created is passed in as the second parameter.
 * package.com script: "npm run copyDir.ts <pathToSourceDir> <pathToDistDir>".
 *
 * Both paths must be relative to the directory that the node_modules directory (that contains the package 'app-root-path') is in.
 *
 */

import appRootObject from 'app-root-path';
import fs = require('fs');
import path = require('path');
import shell = require('shelljs');

const appRoot = appRootObject.toString();

/* create path to the directory to copy from passed in parameter */
const dirToCopy = path.join(appRoot, process.argv[2]);

/* create path to the parent directory to copy to from passed in parameter */
const dirDestination = path.join(appRoot, process.argv[3]);

if (!fs.existsSync(dirToCopy)) {
  console.error('ERROR: source directory not found');
  process.exit(1);
}

shell.cp('-R', dirToCopy, dirDestination);

if (!fs.existsSync(dirDestination)) {
  console.error('ERROR: dist directory not found');
  process.exit(1);
}
