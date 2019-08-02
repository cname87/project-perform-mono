"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const appRootObject = require("app-root-path");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const appRoot = appRootObject.toString();
/* create path to .nyc_output file in /backend root */
const filePath1 = path.join(appRoot, '.nyc_output');
shell.rm('-rf', filePath1);
if (fs.existsSync(filePath1)) {
    console.error('.nyc_output file not deleted');
}
/* create path to .nyc_output file in project root */
const filePath2 = path.join(appRoot, '..', '.nyc_output');
shell.rm('-rf', filePath2);
if (fs.existsSync(filePath2)) {
    console.error('.nyc_output file not deleted');
}
//# sourceMappingURL=delNycFile.js.map