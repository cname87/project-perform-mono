/**
 * This module starts a http server.
 * It relies on a server object with methods in a separate module.
 * It returns the server started in an array property of the input
 * parameter, (so the server can be closed later).
 */

import { setupDebug } from '../utils/src/debugOutput';
const { modulename, debug } = setupDebug(__filename);

import { Server } from './server';

/* external dependencies */
import express from 'express';
import http from 'http';
import winston from 'winston';

/**
 * Starts the http server.
 * @param app
 * The express app object. app.appLocals holds other set up objects including the array used to store the server.
 * @returns
 * Void
 * @throws
 * Throws an error if an error occurs during the server listen request.
 */

async function startServer(
  app: express.Application,
  servers: Server[],
  config: {
    PORT: number;
    SVR_LISTEN_TRIES: number;
    SVR_LISTEN_TIMEOUT: number;
  },
  logger: winston.Logger,
  dumpError: Perform.DumpErrorFunction,
) {
  debug(modulename + ': running startServer');

  /**
   * This function sets up the required http server listening on the appropriate port.
   */
  async function connectServer(
    svrType: typeof http,
    svrName: string,
    svrOptions: http.ServerOptions,
    expressApp: http.RequestListener,
    svrPort: number,
    listenRetries: number,
    listenTimeout: number,
  ) {
    const server = new Server();
    server.configureServer(svrName, logger, dumpError);
    server.setupServer(svrType, svrOptions, expressApp);
    try {
      await server.listenServer(svrPort, listenRetries, listenTimeout);
    } catch (err) {
      logger.error(modulename + ': server listen error reported');
      dumpError(err);
      throw err;
    }

    /* store created server */
    servers.push(server);
  }

  const serverType = http;
  const serverName = 'http';
  const serverOptions = {};
  /* process.env.PORT as set by the GCP host - fall back to the required GCP port configured locally */
  const serverPort = +process.env.PORT! || config.PORT;

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

  debug(modulename + ': http server up and listening');
}

/* export the start server function */
export { startServer };
