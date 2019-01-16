/**
 * Utility to delete server dist directory.
 */

import * as shell from 'shelljs';

shell.rm('-rf', 'dist/');
