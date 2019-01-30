/**
 * Utility to delete a dist directory.
 *
 * Usage:
 * Used in package.com.
 * The dist directory to be deleted is passed in as a parameter.
 * package.com script: "npm run delDistDir.ts <pathToDistDir>".
 *
 * The root of <pathToDistDir> is the directory that package.json is in.
 *
 * <pathToDistDir> must end in /dist.
 *
 */

import * as appRootObject from 'app-root-path';
import fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';

const appRoot = appRootObject.toString();

/* create path to dist directory from passed in parameter */
const distPath = path.join(appRoot, process.argv[2]);

if (process.argv[2].slice(-5) !== '/dist') {
  console.error('dist directory not provided');
  process.exit(1);
}

if (!fs.existsSync(distPath)) {
  console.error('dist directory not found');
  process.exit(1);
}

shell.rm('-rf', distPath);

if (fs.existsSync(distPath)) {
  console.error('dist directory not deleted');
  process.exit(1);
}
