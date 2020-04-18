import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { By } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { MemberCardComponent } from './member-card.component';

describe('memberCardComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: NGXLogger, useValue: loggerSpy },
      ],
    }).compileComponents();
  }

  class Page {
    /* get DOM elements */
    get content() {
      return this.findAttribute<HTMLDivElement>('gdArea', 'content');
    }

    constructor(readonly fixture: ComponentFixture<MemberCardComponent>) {}

    private findAttribute<T>(attribute: string, value: string): T {
      const element = this.fixture.debugElement.query(
        By.css(`[${attribute}=${value}]`),
      );
      return element.nativeElement;
    }
  }

  /**
   * Create the component, initialize it, set test variables.
   */
  function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(MemberCardComponent);

    /* create the component instance */
    const component = fixture.componentInstance;

    /* ngOnInit */
    fixture.detectChanges();

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
    };
  }

  describe('component', () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should show a name', async () => {
      const { fixture, component, page } = await setup();
      component.name = 'test name';
      fixture.detectChanges();
      expect(page.content.innerText).toBe('Name: test name', 'name shown');
    });
  });
});
