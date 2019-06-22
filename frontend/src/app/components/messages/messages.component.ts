import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { MessageService } from '../../shared/services/message.service';

/**
 * This component lists messages that are contained in the
 */
@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit {
  messages: string[] = [];
  clear: () => void = () => {};

  constructor(
    private messageService: MessageService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(MessagesComponent.name + ': Starting MessagesComponent');
  }

  ngOnInit(): void {
    this.messages = this.messageService.messages;
    this.clear = this.messageService.clear;
  }

  trackByFn(index: number, _message: string): number {
    return index;
  }
}
