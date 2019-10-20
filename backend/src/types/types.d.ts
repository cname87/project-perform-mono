/**
 * Exports all type extensions and custom types.
 * Custom interfaces and types are exported in a namespace 'Perform'.
 */

declare module 'intercept-stdout';
declare module 'http-shutdown';

/* extension of Express Request to support appLocals, uuid and the Auth0 auth parameter returned by express-jwt */
declare namespace Express {
  export interface Application {
    appLocals: Perform.IAppLocals;
  }
  export interface Request {
    id?: string;
    auth?: {
      sub: string;
      permissions: string[];
    };
    user?: Perform.User;
  }
}

declare namespace Perform {
  /* the Server class is the type for instances if the Server class */
  export type Server = import('../server/server').Server;
  /* the Database class is the type for instances of the Database class */
  export type Database = import('../database/src/database').Database;
  /* passed into startDatabase */
  export type DatabaseConstructor = typeof import('../database/src/database').Database;
  /* type for database.readystate property */
  export const enum DbReadyState {
    Disconnected = 0,
    Connected = 1,
    Connecting = 2,
    Disconnecting = 3,
  }
  /* the user object */
  export type User = import('../users/user').User;
  /* mongoose model */
  export type TModel = import('mongoose').Model<
    import('mongoose').Document,
    {}
  >;
  /* used in dumpError utility */
  export type DumpErrorFunction = (
    message?: any,
    ...optionalParams: any[]
  ) => void;

  /* controllers type */
  export interface IControllers {
    [key: string]: import('express').Router;
  }
  /* extend Model to include autoinc resetCounter() */
  export interface IModelExtended extends TModel {
    resetCount: () => void;
    nextCount: () => number;
  }
  interface IModels {
    members: IModelExtended;
  }
  /* defines a team member */
  export interface IMember {
    name: string;
    id: number;
  }

  export interface IMemberNoId {
    id: number;
  }

  /* extra fields for created errors */
  /* Error: 'name' is mandatory, 'message' is optional */
  export interface IErr extends Error {
    /* set true to show that the error has been dumped already */
    dumped?: boolean;
    /* add a http status code on creation, which is later written into the http response */
    statusCode?: number;
  }

  export type TSigint = (signal?: string) => Promise<void>;
  export type TUncaught = (err: any) => Promise<void>;

  /* create type for the index.ts export (for mocha) */
  export interface IServerIndex {
    debug?: any; // see notes
    appLocals: IAppLocals;
    sigint: TSigint;
    uncaughtException: TUncaught;
    unhandledRejection: TUncaught;
  }

  /* handlers object */
  export interface IHandlers {
    membersHandlers: typeof import('../handlers/members-handlers').membersHandlers;
    miscHandlers: typeof import('../handlers/misc-handlers').miscHandlers;
    errorHandlers: typeof import('../handlers/error-handlers').errorHandlers;
    authenticateHandler: typeof import('../handlers/authenticate-handlers').authenticateHandler;
    authorizeHandler: typeof import('../handlers/authorize-handlers').authorizeHandler;
    membersApi: typeof import('../api/members-api').membersApi;
  }

  export interface IAppLocals {
    configServer: typeof import('../configServer').configServer;
    configDatabase: typeof import('../database/configDatabase').configDatabase;
    /* created http(s) servers */
    servers: Server[];
    controllers: IControllers;
    membersApi: typeof import('../api/members-api').membersApi;
    handlers: IHandlers;
    models: IModels;
    createModelMembers: typeof import('../models/src/members-model').createModelMembers;
    /* database instance */
    database: Perform.Database;
    /* database connection */
    dbConnection: import('mongoose').Connection;
    /* logger service */
    logger: import('winston').Logger;
    /* error logger */
    dumpError: DumpErrorFunction;
    /* event emitter used for test */
    event: import('events').EventEmitter;
    User: typeof import('../users/user').User;
    /* getUser function */
    getUser: typeof import('../users/users').getUser;
  }
}
