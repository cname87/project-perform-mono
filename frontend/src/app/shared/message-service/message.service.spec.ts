import { TestBed } from '@angular/core/testing';

import { MessageService } from './message.service';
import { AppModule } from '../../app.module';
import { APP_BASE_HREF } from '@angular/common';

describe('MessageService', () => {
  async function mainSetup() {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        MessageService,
      ],
    }).compileComponents();
  }

  async function getService() {
    const messageService = TestBed.get(MessageService);
    return {
      messageService,
    };
  }

  async function setup() {
    await mainSetup();
    return getService();
  }

  it('should be created', async () => {
    const { messageService } = await setup();
    expect(messageService).toBeTruthy();
  });

  it('should add a message', async () => {
    const { messageService } = await setup();
    /* expect messages queue to be empty */
    expect(messageService.messages.length).toEqual(0);
    /* add a message */
    messageService.add('Test message');
    /* test */
    expect(messageService.messages[0]).toEqual('Test message');
  });

  it('should clear the message store', async () => {
    const { messageService } = await setup();
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
