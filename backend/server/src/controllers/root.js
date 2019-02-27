"use strict";
/**
 * This module handles all browser requests.
 * It passes the root / request to the index.html file built by the Angular app.
 * It passes all other requests to the Angular app dist directory
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default(`PP_${modulename}`);
debug(`Starting ${modulename}`);
/* dependencies */
const express_1 = tslib_1.__importDefault(require("express"));
const path_1 = tslib_1.__importDefault(require("path"));
exports.router = express_1.default.Router();
/* send anything not found on static server to angular app to enable refreshing of internal pages */
exports.router.get('*', (req, res, _next) => {
    const filepath = path_1.default.join(req.app.locals.config.APP_PATH, 'index.html');
    res.sendFile(filepath);
});
//# sourceMappingURL=root.js.map