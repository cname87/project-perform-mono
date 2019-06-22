import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

/**
 * This service displays a list of string messages.  messages can be added to the list to be displayed by other components.  The displayed messages can be cleared via a reset icon button.
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  messages: string[] = [];

  constructor(private logger: NGXLogger) {
    this.logger.trace(MessageService.name + ': Starting message service');
  }

  add(message: string): void {
    this.logger.trace(MessageService.name + ': Displaying: ' + message);
    this.messages.push(message);
  }

  clear(): void {
    this.logger.trace(MessageService.name + ': Clearing displayed messages');
    this.messages = [];
  }
}
