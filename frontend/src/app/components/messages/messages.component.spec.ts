import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { By } from '@angular/platform-browser';

import { AppModule } from '../../app.module';
import { MessagesComponent } from './messages.component';
import { MessageService } from '../../shared/services/message.service';
import { click } from '../../shared/test-helpers';

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
      ],
    }).compileComponents();
  }
  /* create an object capturing all key DOM elements */
  class Page {
    get mainDiv() {
      return this.findId<HTMLDivElement>('mainDiv') as HTMLDivElement;
    }
    get header() {
      return this.findId<HTMLHeadingElement>('header');
    }
    get clearButton() {
      return this.findId<HTMLButtonElement>('clearBtn');
    }
    get messagesContainer2() {
      return this.findIds<HTMLDivElement>('messages-container');
    }

    constructor(readonly fixture: ComponentFixture<MessagesComponent>) {}

    private findId<T>(id: string): T {
      const element = this.fixture.debugElement.query(By.css('#' + id));
      if (!element) {
        return (null as unknown) as T;
      }
      return element.nativeElement;
    }

    private findIds<T>(id: string): T[] {
      const elements = this.fixture.debugElement.queryAll(By.css('#' + id));
      if (elements.length === 0) {
        return (null as unknown) as T[];
      }
      const htmlElements: T[] = [];
      for (const element of elements) {
        const htmlElement = element.nativeElement as T;
        htmlElements.push(htmlElement);
      }
      return htmlElements;
    }
  }

  /* create the component, initialize it & return test variables */
  async function createComponent() {
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
  describe('component', async () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component should be created');
    });

    it('should have the messageService setup', async () => {
      const { component, fixture } = await setup();
      /* initiate ngOnInit and view changes etc */
      await fixture.detectChanges();
      await fixture.detectChanges();
      /* test */
      expect(component['messageService']).toEqual(
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
  describe('page', async () => {
    it('should not show when no messages', async () => {
      const { fixture, page } = await setup();
      /* initiate ngOnInit and view changes etc */
      await fixture.detectChanges();
      await fixture.detectChanges();
      /* page fields will be null as messages is empty */
      expect(page.header).toBeFalsy();
      expect(page.messagesContainer2).toBeFalsy();
      expect(page.clearButton).toBeFalsy();
    });

    it('should show the added messages', async () => {
      const { fixture, component, page } = await setup();
      /* add messages to the displayed messages array */
      component['messageService'].add('testMessage1');
      component['messageService'].add('testMessage2');
      /* initiate ngOnInit and view changes etc */
      await fixture.detectChanges();
      await fixture.detectChanges();
      expect(page.header.innerText).toEqual('Messages');
      expect(page.messagesContainer2[0].innerText).toEqual(
        component.messages[0].toString(),
      );
      expect(page.messagesContainer2[1].innerText).toEqual(
        component.messages[1].toString(),
      );
      // tslint:disable-next-line: no-magic-numbers
      expect(page.messagesContainer2[2]).toBeFalsy;
      /* the close icon has 'close' as innerText */
      expect(page.clearButton.innerText).toEqual('close');
    });

    it('should click the clear button', async () => {
      const { fixture, component, page } = await setup();
      /* add messages to the displayed messages array */
      component['messageService'].add('testMessage1');
      component['messageService'].add('testMessage2');
      /* initiate ngOnInit and view changes etc */
      await fixture.detectChanges();
      await fixture.detectChanges();
      expect(page.messagesContainer2[0].innerText).toEqual(
        component.messages[0].toString(),
      );
      expect(page.messagesContainer2[1].innerText).toEqual(
        component.messages[1].toString(),
      );
      click(page.clearButton);
      /* initiate ngOnInit and view changes etc */
      await fixture.detectChanges();
      await fixture.detectChanges();
      expect(component.clear).toHaveBeenCalled();
      expect(page.messagesContainer2).toBeFalsy;
    });
  });
});
