/**
 * This module handles errors, i.e. errors passed via the Express
 * error-handling mechanism.  It also handles requests that pass
 * through without a route being identified.
 */
import debugFunction from 'debug';
export declare const debug: debugFunction.Debugger;
/**
 * Catches any request that passes through all middleware
 * to this point without error and creates a 'Not Found' error.
 */
export declare function notFound(_req: any, _res: any, next: any): void;
/**
 * Asssigns a HTTP error code to res.statusCode if appropriate.
 * Note that a code is assigned to communicate a message to the client
 * in the rendered error view, and carries the notion that the error does not
 * require a system restart, apart from code 500 (Internal Server Error).
 * Errors left with code 500 (Internal Server Error) trigger a uncaught
 * exception in the final errorhandling function.
 */
export declare function assignCode(
  err: any,
  _req: any,
  res: any,
  next: any,
): void;
/**
 * Log detail on all errors passed in.
 */
export declare function logError(err: any, req: any, res: any, next: any): void;
/**
 * Sends a response to the client with some error detail if headers
 * are not already sent. The detail sent is dependent on whether
 * the environment is 'production' or not.
 */
export declare function sendErrorResponse(
  err: any,
  req: any,
  res: any,
  next: any,
): void;
/**
 * Emits an uncaught exception (which stops the server) if the error code
 * is 500.  That is, if I have assigned anything other than 500, I understand
 * the error and do not need to close the error.  If I assign the code 500 I
 * am telling the client we had an unexpected server error and I then stop
 * the server (which should restart).
 */
export declare function throwError(
  err: any,
  _req: any,
  res: any,
  next: any,
): void;
//# sourceMappingURL=errorhandler.d.ts.map
