"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appRootObject = tslib_1.__importStar(require("app-root-path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path = tslib_1.__importStar(require("path"));
const shell = tslib_1.__importStar(require("shelljs"));
const appRoot = appRootObject.toString();
/* create path to dist directory from passed in parameter */
const distPath = path.join(appRoot, process.argv[2]);
if (process.argv[2].slice(-5) !== '/dist') {
    console.error('dist directory not provided');
    process.exit(1);
}
if (!fs_1.default.existsSync(distPath)) {
    console.error('ERROR: dist directory not found');
    // process.exit(1);
}
shell.rm('-rf', distPath);
if (fs_1.default.existsSync(distPath)) {
    console.error('dist directory not deleted');
    process.exit(1);
}
//# sourceMappingURL=delDistDir.js.map