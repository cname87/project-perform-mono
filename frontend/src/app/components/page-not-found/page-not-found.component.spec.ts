import { APP_BASE_HREF } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { PageNotFoundComponent } from './page-not-found.component';
import { findCssOrNot } from '../../shared/test-helpers';

describe('PageNotFoundComponent', () => {
  /* setup function run by each sub test suite*/
  async function mainSetup() {
    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
      ],
    }).compileComponents();
  }

  /**
   * Gets key DOM elements.
   */
  class Page {
    get header() {
      return findCssOrNot<HTMLElement>(this.fixture, 'h1.mat-display-1');
    }
    get hint() {
      return findCssOrNot<HTMLElement>(this.fixture, 'h2.title');
    }
    constructor(readonly fixture: ComponentFixture<PageNotFoundComponent>) {}
  }

  /**
   * Create the component, initialize it & set test variables.
   */
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(PageNotFoundComponent);

    /* create the component instance */
    const component = fixture.componentInstance;

    /* run ngOnInit */
    fixture.detectChanges();

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
    };
  }

  describe('component', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });
  });

  describe('page', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should contain a header', async () => {
      const { component, page } = await setup();
      expect(await page.header.innerText).toBe(component.header);
    });

    it('should contain a hint', async () => {
      const { component, page } = await setup();
      expect(await page.hint.innerText).toBe(component.hint);
    });
  });
});
