'use strict';

/**
 * This module holds the http(s) server operations.
 * It provides the following functions:
 * setupServer
 * Creates a http/https server with supplied options.
 * listenServer
 * Sets the supplied server listening on a supplied port.
 * stopServer
 * Stops the supplied server.
 */

import path = require('path');
const modulename = __filename.slice(__filename.lastIndexOf(path.sep));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/**
 * Import external dependencies.
 */
import http = require('http');
import shutdownHelper = require('http-shutdown');

/**
 * Import local types.
 */
import { IErr } from '../configServer';

/**
 * The exported server constructor.
 */
export class Server {
  public name: string;
  public logger: object;
  public dumpError: (err: any) => void;
  public listenErrors: number;
  public expressServer: http.Server;
  public setupServer: (...params: any) => any;
  public listenServer: (...params: any) => any;
  public stopServer: (...params: any) => any;
  public configServer: (...params: any) => any;

  constructor() {
    /* properties */
    this.name = 'not_named';
    this.logger = { error: console.error };
    this.dumpError = console.error;
    /* a count of the number server listen errors allowed */
    this.listenErrors = 3;
    /* the server object returned by express createServer */
    // tslint:disable-next-line: no-object-literal-type-assertion
    this.expressServer = {} as http.Server;

    /* operations methods */
    this.setupServer = setupServer;
    this.listenServer = listenServer;
    this.stopServer = stopServer;
    this.configServer = configServer;
  }
}

/**
 * @description
 * Sets up a configured http(s) server.
 * @param serverType
 * http or https object.
 * @param serverOptions
 * An object holding server configuration options.
 * @param app
 * Express app object.
 * @returns
 * It returns a http(s) server object.
 * The server object has the following added keys:
 * - name: the supplied name is stored here.
 * - listenErrors: holder for the listen errors allowed.
 */

function setupServer(
  this: any,
  serverType: any,
  serverOptions: object,
  app: Express.Application,
) {
  debug(modulename + ': running setupServer');

  /* start and return the http(s) server & load express as listener */
  this.expressServer = serverType.createServer(serverOptions, app);

  /* wrap extra shutdown functionality into server to avoid shutdown issues when debug inspector listening */
  this.expressServer = shutdownHelper(this.expressServer);

  /* store a count of the number server listen errors allowed */
  this.listenErrors = 0;

  debug(modulename + `: server.expressServer ${this.name} created`);
  return this.expressServer;
}

/**
 * Starts the provided server listening on the
 * supplied port.
 * Will prompt a supplied number of times (default 3)
 * at a supplied interval (default 5s) if the supplied
 * port is occupied.
 * @param serverPort
 * The port that the server will listen on.
 * @param listenTries 3
 * The total number of listen tries made.
 * Retries are only made if the port is occupied.
 * @param listenTimeout 5
 * The time in seconds allowed between each retry.
 * @returns
 * Returns a promise.
 * Resolves to a listening server object if successful.
 * The supplied server object is changed into a listening
 * server object.
 * Returns void if the listen request fails.
 * @throws
 * Throws an error if the listen request fails.
 * (Note: If supplied with a listening server, it will stop
 * the server, but start and return a listening server with
 * no error).
 */

async function listenServer(
  this: any,
  serverPort: number,
  listenTries = 3,
  listenTimeout = 5,
) {
  debug(modulename + ': running listenServer');

  async function listenCallback(
    this: any,
    resolve: (x: any) => void,
    reject: (x: IErr) => void,
  ) {
    debug(modulename + ': running listenCallback');

    function listenHandler(this: any) {
      /* remove the unused error handle */
      this.expressServer.removeListener('error', errorHandler);
      debug(
        `${modulename}: ${this.name} server` +
          ` listening on port ${this.expressServer.address().port}`,
      );
      resolve(this.expressServer);
    }

    async function errorHandler(this: any, err: any) {
      /* if an occupied port is reported then
            allow time for port to be freed then try again */
      if (err.code === 'EADDRINUSE') {
        /* remove the unused listening handle */
        this.expressServer.removeListener('listening', listenHandler);
        this.listenErrors++;
        if (this.listenErrors < listenTries) {
          this.logger.error(
            modulename +
              ': Port ' +
              `${serverPort} is in use following attempt ` +
              `${this.listenErrors} of ` +
              `${listenTries} - retrying in ${listenTimeout}s`,
          );
          setTimeout(
            listenCallback.bind(this),
            listenTimeout * 1000,
            resolve,
            reject,
          );
        } else {
          /* we have retried the configured number of times */
          this.logger.error(
            modulename +
              ': Port ' +
              `${serverPort} is still in use following ` +
              `${listenTries} attempts` +
              ' - reporting error and shutting down',
          );
          reject(err);
        }
      } else {
        /* all other reported errors are immediately fatal */
        this.logger.error(
          modulename + ': Server listen error other than EADDRINUSE',
        );
        reject(err);
      }
    }

    /* if listen request successful then handled here */
    this.expressServer.once('listening', listenHandler.bind(this));

    /* if listen error reported then handled here */
    this.expressServer.once('error', errorHandler.bind(this));

    /* ask the server to listen and trigger event */
    this.expressServer.listen({
      port: serverPort,
    });
  }

  try {
    /* only ask to listen if the server is not already listening */
    if (!this.expressServer.listening) {
      return await new Promise(listenCallback.bind(this));
    } else {
      return;
    }
  } catch (err) {
    this.logger.error(modulename + ': Unrecoverable server listen error');
    this.dumpError(err);
    throw err;
  }
}

/**
 * Stops a http(s) server.
 * @returns
 * Returns a resolved promise:
 * Resolves to undefined if successful.
 * Resolves to an error if the server passed in
 * was not open, or if another shutdown error occurred.
 * (Note: The error is returned and not thrown).
 */

async function stopServer(this: any) {
  debug(modulename + ': running stopServer');

  function shutServer(
    this: any,
    resolve: (x: any) => void,
    reject: (x: IErr) => void,
  ) {
    this.expressServer.shutdown((err: any) => {
      if (err) {
        debug(modulename + `: server \'${this.name}\' shut down error`);
        reject(err);
      }

      debug(modulename + ': server connection ' + `\'${this.name}\' closed`);
      resolve(err);
    });
  }

  try {
    debug(modulename + `: stopping server ${this.name}`);
    return await new Promise(shutServer.bind(this));
  } catch (err) {
    const message = ': error running stopServer';
    this.logger.error(modulename + message);
    this.dumpError(err);
    return err;
  }
}

/**
 * Called to pass in configuration data.
 * Also optionally passes in a logger and an error logging function.
 * @param name
 * can be used to identify the server, e.g. 'http' or 'https'
 * @param logger
 * A winston logger supporting logger.error('text').
 * Defaults to Console, i.e. console.error replaces logger.error.
 * @param dumpError
 * A utility that takes an Error object as argument and logs it.
 * Defaults to console.error.
 */

function configServer(
  this: any,
  name = '',
  logger = { error: console.error },
  dumpError = console.error,
) {
  this.name = name;
  this.logger = logger;
  this.dumpError = dumpError;
}
