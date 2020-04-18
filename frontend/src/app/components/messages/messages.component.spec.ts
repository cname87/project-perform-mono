/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { MessagesComponent } from './messages.component';
import { MessageService } from '../../shared/message-service/message.service';
import {
  click,
  findCssOrNot,
  findAllCssOrNot,
} from '../../shared/test-helpers';

/* create interfaces for stubs to be injected */
interface IMessageServiceStub {
  messages: string[];
  add: jasmine.Spy;
  clear: jasmine.Spy;
}

/* run tests */
describe('messagesComponent', () => {
  /* setup function run by each 'it' test suite */
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    /* create stub instances with spies for injection */
    const messageServiceStub: IMessageServiceStub = {
      messages: [],
      add: jasmine
        .createSpy('add')
        .and.callFake(function add(this: IMessageServiceStub, message: string) {
          this.messages.push(message);
        }),
      clear: jasmine
        .createSpy('clear')
        .and.callFake(function clear(this: IMessageServiceStub) {
          this.messages = [];
        }),
    };

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: MessageService, useValue: messageServiceStub },
        { provide: NGXLogger, useValue: loggerSpy },
      ],
    }).compileComponents();
  }
  /* create an object capturing all key DOM elements */
  class Page {
    get mainDiv() {
      return findCssOrNot<HTMLDivElement>(this.fixture, '#mainDiv');
    }

    get header() {
      return findCssOrNot<HTMLHeadingElement>(this.fixture, '#header');
    }

    get clearButton() {
      return findCssOrNot<HTMLButtonElement>(this.fixture, '#clearBtn');
    }

    get messagesContainer() {
      return findAllCssOrNot<HTMLDivElement>(
        this.fixture,
        '#messages-container',
      );
    }

    constructor(readonly fixture: ComponentFixture<MessagesComponent>) {}
  }

  /* create the component, initialize it & return test variables */
  function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(MessagesComponent);

    /* get the injected instances */
    const messageServiceInjected = fixture.debugElement.injector.get<
      IMessageServiceStub
    >(MessageService as any);

    /* create the component instance */
    const component = fixture.componentInstance;

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      messageServiceInjected,
    };
  }

  /* setup function run by each sub test function */
  async function setup() {
    await mainSetup();
    return createComponent();
  }

  /* run the component-level tests */
  describe('component', () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component should be created');
    });

    it('should have the messageService', async () => {
      const { component, fixture } = await setup();
      /* initiate ngOnInit and view changes etc */
      fixture.detectChanges();
      await fixture.whenStable();
      /* test */
      expect(component.messageService).toEqual(
        fixture.debugElement.injector.get<MessageService>(MessageService),
      );
    });

    it('should test trackBy function returns input index', async () => {
      const { component } = await setup();
      const testIndex = 9;
      const result = component.trackByFn(testIndex, 'test');
      expect(result).toEqual(testIndex);
    });
  });

  /* run the page-level tests */
  describe('page', () => {
    it('should not show when no messages', async () => {
      const { fixture, page } = await setup();
      /* initiate ngOnInit and view changes etc */
      fixture.detectChanges();
      await fixture.whenStable();
      /* page fields will be null as messages is empty */
      expect(page.header).toBeFalsy();
      expect(page.messagesContainer).toBeFalsy();
      expect(page.clearButton).toBeFalsy();
    });

    it('should show the added messages', async () => {
      const {
        fixture,
        component,
        page,
        messageServiceInjected,
      } = await setup();
      /* add messages to the displayed messages array */
      component.messageService.add('testMessage1');
      component.messageService.add('testMessage2');
      /* initiate ngOnInit and view changes etc */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.header!.innerText).toEqual('Messages');
      expect(page.messagesContainer![0].innerText).toEqual(
        messageServiceInjected.messages[0].toString(),
      );
      expect(page.messagesContainer![1].innerText).toEqual(
        messageServiceInjected.messages[1].toString(),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(page.messagesContainer![2]).toBeFalsy;
      /* the close icon has 'close' as innerText */
      expect(page.clearButton!.innerText).toEqual('close');
    });

    it('should click the clear button', async () => {
      const {
        fixture,
        component,
        page,
        messageServiceInjected,
      } = await setup();
      /* add messages to the displayed messages array */
      component.messageService.add('testMessage1');
      component.messageService.add('testMessage2');
      /* initiate ngOnInit and view changes etc */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.messagesContainer![0].innerText).toEqual(
        messageServiceInjected.messages[0].toString(),
      );
      expect(page.messagesContainer![1].innerText).toEqual(
        messageServiceInjected.messages[1].toString(),
      );
      click(page.clearButton!);
      /* initiate ngOnInit and view changes etc */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(messageServiceInjected.clear).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(page.messagesContainer).toBeFalsy;
    });
  });
});
