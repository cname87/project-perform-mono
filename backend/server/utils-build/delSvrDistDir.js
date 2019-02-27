"use strict";
/**
 * Utility to delete server dist directory.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appRootObject = tslib_1.__importStar(require("app-root-path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path = tslib_1.__importStar(require("path"));
const shell = tslib_1.__importStar(require("shelljs"));
const appRoot = appRootObject.toString();
/* must match path to server/dist directory */
const distPath = path.join(appRoot, 'dist');
shell.rm('-rf', distPath);
if (fs_1.default.existsSync(distPath)) {
    console.error('dist directory not deleted');
    shell.exit(1);
}
//# sourceMappingURL=delSvrDistDir.js.map