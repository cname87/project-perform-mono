import { TestBed } from '@angular/core/testing';

import { MessageService } from './message.service';

describe('MessageService', () => {
  function setup() {
    const messageService = TestBed.get(MessageService);
    return {
      messageService,
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService],
    });
  });

  it('should be created', () => {
    const { messageService } = setup();
    expect(messageService).toBeTruthy();
  });

  it('should add a message', () => {
    const { messageService } = setup();
    /* expect messages queue to be empty */
    expect(messageService.messages.length).toEqual(0);
    /* add a message */
    messageService.add('Test message');
    /* test */
    expect(messageService.messages[0]).toEqual('Test message');
  });

  it('should clear the message store', () => {
    const { messageService } = setup();
    /* expect messages queue to be empty */
    expect(messageService.messages.length).toEqual(0);
    /* add a message */
    messageService.add('Test message');
    /* test */
    expect(messageService.messages[0]).toEqual('Test message');
    /* clear the message store */
    messageService.clear();
    /* expect messages queue to be empty */
    expect(messageService.messages.length).toEqual(0);
  });
});
