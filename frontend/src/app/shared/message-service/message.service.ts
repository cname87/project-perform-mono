import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

/**
 * This service displays a list of string messages.  Messages can be added to the list by other components.  The displayed messages can be cleared via a clear icon button.
 */
@Injectable({
  providedIn: 'root',
})
export class MessageService {
  messages: string[] = [];

  constructor(private logger: NGXLogger) {
    this.logger.trace(MessageService.name + ': Starting message service');
  }

  add(message: string) {
    this.logger.trace(MessageService.name + ': Displaying: ' + message);
    this.messages.push(message);
  }

  clear(): void {
    this.logger.trace(MessageService.name + ': Clearing displayed messages');
    this.messages = [];
  }
}
