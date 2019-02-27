/**
 * This application runs a http(s) server with a database backend.
 * It creates a controllers object listing the supported base controllers.
 * It creates a handles object listing the supported handlers.
 * It creates a 'objects' object which is used to store the database connection,
 * database session information and server information for use throughout
 * the application.
 * It reads a server configuration file into a configuration object
 * It attempts to start the database and then starts the server,
 * injecting the above controllers, handles and communication
 * and configuration objects.
 * It can start the server in the absence of a database connection
 * if the configuration file is so configured.
 * It can be stopped via a SIGINT, or if started via a forever
 * monitoring service via a message from the forever process.
 */
/// <reference types="node" />
import debugFunction from 'debug';
export declare const debug: debugFunction.Debugger;
import { EventEmitter } from 'events';
export declare const event: EventEmitter;
export declare function uncaughtException(err: Error): Promise<void>;
export declare function unhandledRejection(reason: any): Promise<void>;
export declare function sigint(): Promise<void>;
export declare const appObjects: any;
//# sourceMappingURL=index.d.ts.map
