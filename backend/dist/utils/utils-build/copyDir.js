"use strict";
/**
 * Utility to copy files in static folders to the dist directory.
 *
 * Usage:
 * Used in package.com.
 * The directory containing the static files is passed in as a parameter.
 * The parent directory where you want the directory created is passed in as a parameter.
 * package.com script: "npm run copyDir.ts <pathToEnvFile> <pathToDistDir>".
 *
 * Both paths are relative to the package.json directory.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const appRootObject = require("app-root-path");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
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
//# sourceMappingURL=copyDir.js.map