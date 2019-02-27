/**
 * Utility to delete server dist directory.
 */

import * as appRootObject from 'app-root-path';
import fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';

const appRoot = appRootObject.toString();

/* must match path to server/dist directory */
const distPath = path.join(appRoot, 'dist');

shell.rm('-rf', distPath);

if (fs.existsSync(distPath)) {
  console.error('dist directory not deleted');
  shell.exit(1);
}
