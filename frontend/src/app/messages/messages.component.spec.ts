import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { By } from '@angular/platform-browser';

import { AppModule } from '../app.module';
import { MessagesComponent } from './messages.component';
import { MessageService } from '../message.service';
import { click } from '../tests';

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
    get div2() {
      return this.findIds<HTMLDivElement>('div2');
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

  /* run the component-level tests */
  describe('component', async () => {
    /* setup function run by each it test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should have the messageService setup', async () => {
      const { component, fixture } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* test */
      expect(component.messageService).toEqual(
        fixture.debugElement.injector.get(MessageService),
      );
    });

    it('should test trackBy function returns input index', async () => {
      const { component } = await setup();
      const result = component.trackByFn(9, 'test');
      expect(result).toEqual(9);
    });
  });

  /* run the page-level tests */
  describe('page', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should not show when no messages', async () => {
      const { fixture, page } = await setup();
      fixture.detectChanges();
      await fixture.whenStable();
      /* page fields will be null as messages is empty */
      expect(page.header).toBeFalsy();
      expect(page.div2).toBeFalsy();
      expect(page.clearButton).toBeFalsy();
    });

    it('should show the added messages', async () => {
      const { fixture, component, page } = await setup();
      /* add messages to the displayed messages array */
      component.messageService.add('testMessage1');
      component.messageService.add('testMessage2');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.header.innerText).toEqual('Messages');
      expect(page.div2[0].innerText).toEqual(
        component.messageService.messages[0].toString(),
      );
      expect(page.div2[1].innerText).toEqual(
        component.messageService.messages[1].toString(),
      );
      expect(page.div2[2]).toBeFalsy;
      expect(page.clearButton.innerText).toEqual('clear');
    });

    it('should click the clear button', async () => {
      const { fixture, component, page } = await setup();
      /* add messages to the displayed messages array */
      component.messageService.add('testMessage1');
      component.messageService.add('testMessage2');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.div2[0].innerText).toEqual(
        component.messageService.messages[0].toString(),
      );
      expect(page.div2[1].innerText).toEqual(
        component.messageService.messages[1].toString(),
      );
      click(page.clearButton);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.messageService.clear).toHaveBeenCalled();
      expect(page.div2).toBeFalsy;
    });
  });
});
