/**
 * Utility to delete the mocha/istanbul nyc_output file.
 *
 * .nyc_output can be used to reprint the coverage report but it is easier to just look at the index.html in the coverage directory.
 *
 * It is generated in the node app root, i.e. if node run from /backend then the file to delete is /backend/.nyc_output.
 *
 * Usage:
 * Used in package.com: npm run delNyc
 *
 * It will not fail if the file does not exist.
 * npm will not see an error if the file is not deleted.
 *
 */

import * as appRootObject from 'app-root-path';
import fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';

const appRoot = appRootObject.toString();

/* create path to .nyc_output file in workspace root */
const filePath = path.join(appRoot, '.nyc_output');

shell.rm('-rf', filePath);

if (fs.existsSync(filePath)) {
  console.error('.nyc_output file not deleted');
}
