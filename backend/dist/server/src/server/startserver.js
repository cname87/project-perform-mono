"use strict";
/// <reference types="../../types/types" />
/**
 * This module starts a http(s) server.
 * It relies on a server object with methods in a separate module.
 * It returns the servers started in a property of the input
 * parameter, (so they can be closed later).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
const secure = require("express-force-ssl");
const fs = require("fs");
const http = require("http");
const https = require("https");
/**
 * Starts the http(s) server.
 * @param app
 * The express app object
 * app.appLocals holds other set up objects including the array used to store
 * the https(s) servers.
 * @returns
 * Void
 * @throws
 * Throws an error if an error occurs during the server listen request.
 */
async function startServer(app, servers, config, logger, dumpError) {
    debug(modulename + ': running startServer');
    /* import serverops module */
    const Server = config.Server;
    /* server connection utility function */
    async function connectServer(svrType, svrName, svrOptions, expressApp, svrPort, listenRetries, listenTimeout) {
        const server = new Server();
        server.configServer(svrName, logger, dumpError);
        server.setupServer(svrType, svrOptions, expressApp);
        try {
            await server.listenServer(svrPort, listenRetries, listenTimeout);
        }
        catch (err) {
            logger.error(modulename + ': server listen error reported');
            dumpError(err);
            throw err;
        }
        /* store created server in objects */
        servers.push(server);
    }
    /* set up http server connection variables */
    let serverType = http;
    let serverName = 'http';
    let serverOptions = {};
    let serverPort = 80;
    /* redirects default port 80 traffic to the https port */
    if (config.HTTPS_ON) {
        /* set option for express-force-ssl */
        app.set('forceSSLOptions', {
            httpsPort: config.PORT,
        });
        /* force http redirection */
        app.use(secure);
        /* starts the http server which is redirected to https port*/
        await connectServer(serverType, serverName, serverOptions, app, serverPort, config.SVR_LISTEN_TRIES, config.SVR_LISTEN_TIMEOUT);
        /* overwrite default http server settings */
        serverType = https;
        serverName = 'https';
        // ssl credentials
        serverOptions = {
            cert: fs.readFileSync(config.HTTPS_CERT),
            key: fs.readFileSync(config.HTTPS_KEY),
        };
        serverPort = config.PORT;
    }
    /* start the https server */
    await connectServer(serverType, serverName, serverOptions, app, serverPort, config.SVR_LISTEN_TRIES, config.SVR_LISTEN_TIMEOUT);
    debug(modulename + ': https(s) server up and listening');
}
exports.startServer = startServer;
//# sourceMappingURL=startserver.js.map