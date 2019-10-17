/// <reference types="../../types/types" />
/**
 * This module starts a http(s) server.
 * It relies on a server object with methods in a separate module.
 * It returns the servers started in a property of the input
 * parameter, (so they can be closed later).
 */

import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/* external dependencies */
import express = require('express');
import secure = require('express-force-ssl');
import fs = require('fs');
import http = require('http');
import https = require('https');

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

async function startServer(
  app: express.Application,
  servers: any,
  config: any,
  logger: any,
  dumpError: any,
) {
  debug(modulename + ': running startServer');

  /* import serverops module */
  const Server = config.Server;

  /**
   * This function sets up the required http(x) server(s) listening on appropriate ports.
   * See the server section in the configServer file for the configuration options.
   */
  async function connectServer(
    svrType: any,
    svrName: string,
    svrOptions: object,
    expressApp: express.Application,
    svrPort: number,
    listenRetries: number,
    listenTimeout: number,
  ) {
    const server: any = new Server();
    server.configServer(svrName, logger, dumpError);
    server.setupServer(svrType, svrOptions, expressApp);
    try {
      await server.listenServer(svrPort, listenRetries, listenTimeout);
    } catch (err) {
      logger.error(modulename + ': server listen error reported');
      dumpError(err);
      throw err;
    }

    /* store created server in objects */
    servers.push(server);
  }

  /* the default mode is assumed to be when the server is hosted by the GCP host i.e. process.envNODE_ENV === 'production' */
  /* the default mode is http as required by the GCP host */
  let serverType: any = http;
  let serverName = 'http';
  let serverOptions = {};
  /* the default is that port is process.env.PORT as set by the GCP host (only)falling back to the known GCP port configured locally */
  let serverPort = +process.env.PORT! || config.PORT;

  /* if in development mode it is assumed that the server is local => set up either a https server on a configured port and redirect default http port 80 traffic to the https server, or set up a http server listening on the configured port */
  if (process.env.NODE_ENV === 'development') {
    if (config.HTTPS_ON) {
      /* set option for express-force-ssl */
      app.set('forceSSLOptions', {
        httpsPort: config.PORT,
      });
      /* force http redirection */
      app.use(secure);

      /* set http server port to 80 - requests to 80 will be redirected */
      serverPort = 80;

      /* starts the http server which is redirected to https port*/
      await connectServer(
        serverType,
        serverName,
        serverOptions,
        app,
        serverPort,
        config.SVR_LISTEN_TRIES,
        config.SVR_LISTEN_TIMEOUT,
      );

      /* overwrite default http server settings to set up a https server */
      serverType = https;
      serverName = 'https';
      // ssl credentials
      serverOptions = {
        cert: fs.readFileSync(config.HTTPS_CERT),
        key: fs.readFileSync(config.HTTPS_KEY),
      };
      serverPort = config.PORT;
    }
  }

  /* start the server */
  await connectServer(
    serverType,
    serverName,
    serverOptions,
    app,
    serverPort,
    config.SVR_LISTEN_TRIES,
    config.SVR_LISTEN_TIMEOUT,
  );

  debug(modulename + ': https(s) server up and listening');
}

/* export the start server function */
export { startServer };
