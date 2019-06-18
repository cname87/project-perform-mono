import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

@Injectable({ providedIn: 'root' })
export class MessageService {
  messages: string[] = [];

  constructor(private logger: NGXLogger) {
    console.log('starting message service');
  }

  add(message: string) {
    this.logger.trace(MessageService.name + ': Displaying: ' + message);
    this.messages.push(message);
  }

  clear() {
    this.logger.trace(MessageService.name + ': Clearing displayed messages');
    this.messages = [];
  }
}
