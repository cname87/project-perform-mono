import {
  Injectable,
  InjectionToken,
  ErrorHandler,
  Injector,
  NgZone,
} from '@angular/core';
import { Router } from '@angular/router';
import Rollbar from 'rollbar';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';

import { MessageService } from '../services/message.service';

const rollbarConfig = {
  accessToken: '250417311abc413693bafa5c137de33c',
  captureUncaught: true,
  captureUnhandledRejections: true,
};

export const RollbarService = new InjectionToken<Rollbar>('rollbar');

export function rollbarFactory() {
  return new Rollbar(rollbarConfig);
}

/**
 * This service provides a common error handling function.
 *
 * Error handling strategy
 * -----------------------
 *
 * Unexpected non-http errors are passed directly to here.
 * Expected non-http errors may be handled elsewhere with a customised error report rethrown to be handled here.
 * Http errors are first handled by http-error-interceptor which retries and carries out other common handling routines e.g. authorization token refresh.
 * The http error is then passed back to the service method that handles the api request from all requesters, e.g. the member-service methods such as getMembers.  This service method has four functions:
 * - handle errors specific to that request e.g. a 404 may require special handling.
 * - inform the user as appropriate.
 * - reply to the function that raised the request e.g. 'null' or whatever is appropriate.
 * - pass the error on if appropriate.
 * The original requesting function has no error handling function i.e. if it receives an error back from members.service it just passes it on to this handler.
 * This handler:
 * - logs the error with the logger service.
 * - logs the error with Rollbar.
 * - informs the user as appropriate.
 */
@Injectable()
export class CustomErrorHandler implements ErrorHandler {
  /* count variables */
  private unexpectedErrorCount = 0;
  private reloadCount = 3;

  constructor(private injectors: Injector) {}

  /* using gets (and zone below) resolved some issues getting services */
  get zone(): NgZone {
    return this.injectors.get<NgZone>(NgZone);
  }

  get logger(): NGXLogger {
    return this.injectors.get<NGXLogger>(NGXLogger);
  }

  get router(): Router {
    return this.injectors.get<Router>(Router);
  }

  get toastr(): ToastrService {
    return this.injectors.get<ToastrService>(ToastrService);
  }

  get messageService(): MessageService {
    return this.injectors.get<MessageService>(MessageService);
  }

  get rollbar(): Rollbar {
    return this.injectors.get<Rollbar>(RollbarService);
  }

  /**
   * Displays a message on the web page message log.
   */
  private log(message: string): void {
    this.logger.trace(CustomErrorHandler.name + ': Reporting: ' + message);
    this.messageService.add(CustomErrorHandler.name + `: ${message}`);
  }

  /* Note: You could extend ErrorHandler and use super(true) in the constructor to cause errors to be rethrown which causes things like bootstrap to fail if an error is thrown - otherwise bootstrap will never fail */

  handleError(error: any): void {
    this.logger.trace(CustomErrorHandler.name + ': handleError called');

    /* the object to be logged */
    let err;

    /* error.type is set if the error was caught in http-error-intercept */
    if (error.type) {
      this.logger.trace(CustomErrorHandler.name + ': Http error reported');
      /* create err for logging from the http-interceptor error report which will have a defined IErrReport type */
      err = {
        type: error.type,
        message: error.message,
        status: error.status,
        body: error.body,
      };
      /* only include embedded error for passing to Rollbar */
      error = error.error;
    } else {
      this.logger.trace(CustomErrorHandler.name + ': Non-http error reported');
      /* create err for logging from the error */
      err = {
        type: 'Non-http error',
        message: error.message ? error.message : error.toString(),
        stack: error.stack ? error.stack : 'Not supplied',
      };
    }

    /* log error, including to the backend server, if so configured */
    this.logger.trace(CustomErrorHandler.name + ': Logging error');
    this.logger.error(err);

    /* send the error to rollbar */
    this.logger.trace(CustomErrorHandler.name + ': Sending error to Rollbar');
    this.rollbar.error(error);

    /* inform user, if not already done  */
    if (!error.isUserInformed) {
      this.logger.trace(CustomErrorHandler.name + ': Informing user');
      /* using zone (and gets above) resolved some issues getting services */
      this.zone.run(() => {
        this.log('ERROR: An unknown error occurred');
        this.router.navigateByUrl('/errorinformation/error');
        this.toastr.error('ERROR!', 'An unknown error has occurred');
      });
    }

    /* count non-http-intercept errors and reload after a set count */
    if (!error.type) {
      this.unexpectedErrorCount++;
      if (this.unexpectedErrorCount >= this.reloadCount) {
        this.unexpectedErrorCount = 0;
        window.location.reload();
      }
    }
  }
}
