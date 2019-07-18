import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { MessageService } from '../../shared/message-service/message.service';

/**
 * This component lists messages added by other components.
 * This component imports messageService as a public property as the tamplate accesses that service's properties directly (as they are also updated by other components so can't use a local copy).
 */
@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit {
  constructor(
    public messageService: MessageService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(MessagesComponent.name + ': Starting MessagesComponent');
  }

  ngOnInit(): void {}

  trackByFn(index: number, _message: string): number {
    return index;
  }
}
