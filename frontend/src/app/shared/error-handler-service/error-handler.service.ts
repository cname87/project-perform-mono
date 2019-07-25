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

import { MessageService } from '../message-service/message.service';
import { errorTypes } from '../../config';

/* set up the rollbar service */
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
 * Expected non-http errors may be handled where they arise passing an error report meeting the IErrReport Interface here, specifically with an allocatedType to indicate that they have been handled.
 * Http errors are first handled by http-error-interceptor which retries and carries out other common handling routines e.g. authorization token refresh. It creates an error report and adds a property categorizing the error as server- or client-side.
 * The http error is then passed back to the service method that handles the api request from all requesters, e.g. the member-service methods such as getMembers.  This service method has four functions:
 * - Handle errors specific to that request e.g. a 404 may require special handling.
 * - Inform the user as appropriate. A flag can be set which prevents further information being sent to the customer by this handler.
 * - Reply to the function that raised the request e.g. 'null' or whatever is appropriate.
 * - Throws on the error report with an isHandled property set true.
 * The original requesting function calls handleError passing the error report.
 * This handler:
 * - carry out any final actions on specific error types.
 * - logs the error with the logger service.
 * - logs the error with Rollbar.
 * - informs the user as appropriate, i.e. for unhandled errors.
 */
@Injectable()
export class ErrorHandlerService implements ErrorHandler {
  constructor(private injectors: Injector) {
    this.logger.trace(
      ErrorHandlerService.name + ': Starting ErrorHandlerService',
    );
  }

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
    this.logger.trace(ErrorHandlerService.name + ': Reporting: ' + message);
    this.messageService.add(ErrorHandlerService.name + `: ${message}`);
  }

  /**
   *
   * @param errReport This is either a managed error and will thus meet the IErrReport interface but may also be any unexpected error.
   */
  handleError(errReport: any): void {
    this.logger.trace(ErrorHandlerService.name + ': handleError called');

    switch (errReport.allocatedType) {
      case errorTypes.httpClientSide:
      case errorTypes.httpServerSide: {
        this.logger.trace(ErrorHandlerService.name + ': Http error reported');
        break;
      }
      default: {
        /* this was an unexpected error */
        this.logger.trace(
          ErrorHandlerService.name + ': Unexpected error reported',
        );
      }
    }

    /* log an error report to console */
    this.logger.trace(ErrorHandlerService.name + ': Logging the error');
    this.logger.error(errReport);

    /* send the error to rollbar */
    this.logger.trace(ErrorHandlerService.name + ': Sending error to Rollbar');
    this.rollbar.error(errReport);

    /* navigate to an error page if the error has not been handled */
    if (!errReport.isHandled) {
      /* using zone (and the gets above) resolved some issues accessing the services, and also handling unexpected errors (?) */
      /* "If a method is called from code that was invoked outside Angular's zone, everything runs outside the zone until this event is fully processed. With zone.run(...) you force execution back into Angular's zone." */
      this.zone.run(() => {
        this.log('ERROR: An unknown error occurred');
        /* navigate to error information page and then show toastr message */
        this.router.navigateByUrl('/information/error').then(() => {
          this.logger.trace(
            ErrorHandlerService.name + ': Showing toastr message',
          );
          this.toastr.error('ERROR!', 'An unknown error has occurred');
        });
      });
    }
  }
}
