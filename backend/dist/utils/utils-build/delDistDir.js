"use strict";
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
 * <pathToDistDir> is relative to the directory that the node_modules directory (that contains 'app-root-path') is in.
 *
 * <pathToDistDir> must end in /dist.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const appRootObject = require("app-root-path");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const appRoot = appRootObject.toString();
/* create path to dist directory from passed in parameter */
const distPath = path.join(appRoot, process.argv[2]);
if (process.argv[2].slice(-5) !== '/dist') {
    console.error('dist directory not provided');
    process.exit(1);
}
if (!fs.existsSync(distPath)) {
    console.error('ERROR: dist directory not found');
    // process.exit(1);
}
shell.rm('-rf', distPath);
if (fs.existsSync(distPath)) {
    console.error('dist directory not deleted');
    process.exit(1);
}
//# sourceMappingURL=delDistDir.js.map