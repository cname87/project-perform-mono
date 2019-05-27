import { Component, OnInit } from '@angular/core';
import { MessageService } from '../../shared/services/message.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit {
  constructor(public messageService: MessageService) {}

  ngOnInit() {}

  trackByFn(index: number, _message: string) {
    return index;
  }
}
