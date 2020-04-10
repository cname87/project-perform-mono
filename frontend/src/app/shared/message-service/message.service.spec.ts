import { TestBed } from '@angular/core/testing';
import { NGXLogger } from 'ngx-logger';

import { APP_BASE_HREF } from '@angular/common';
import { MessageService } from './message.service';
import { AppModule } from '../../app.module';

describe('MessageService', () => {
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: NGXLogger, useValue: loggerSpy },
        MessageService,
      ],
    }).compileComponents();
  }

  function getService() {
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
