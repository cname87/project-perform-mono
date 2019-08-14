import { ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';

import { AppComponent } from './app.component';
import { findAllCssOrNot } from '../../shared/test-helpers';
import { AppModule } from '../../app.module';

describe('AppComponent', () => {
  /* setup function run by each 'it' test suite */
  async function mainSetup() {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [AppModule],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
      ],
    }).compileComponents();
  }

  class Page {
    /* get an array of all parent html elements on the page */
    getTopLevelTags() {
      /* get all html elements on the page */
      const htmlElements = findAllCssOrNot<HTMLElement>(this.fixture, '*');
      /* filter to top-level tags only */
      const htmlTags = htmlElements!
        .filter(
          /* it APPEARS that parentElement.id will be 'root0' or 'root1' for the top-level element i.e. the karma page uses a div with id="root0" or "root1" to hold the component page */
          (element) =>
            element.parentElement!.id.slice(0, 'root'.length) === 'root',
        )
        /* return the element tag name */
        .map((element) => element.tagName);
      return htmlTags;
    }
    constructor(readonly fixture: ComponentFixture<AppComponent>) {}
  }

  function createExpected() {
    return {
      /* list the tags in app.component.html here in order and in uppercase */
      htmlTags: [
        'APP-LOGIN',
        'MAT-DIVIDER',
        'APP-NAV',
        'ROUTER-OUTLET',
        'MAT-DIVIDER',
        'APP-MESSAGES',
      ],
    };
  }

  /* create the component and get test variables */
  function createComponent() {
    const fixture = TestBed.createComponent(AppComponent);

    /* get the various expected values */
    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      expected,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup() {
    await mainSetup();
    const testVars = createComponent();
    return testVars;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup() {
    const testVars = await preSetup();
    /* initiate ngOnInit and view changes etc */
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    return testVars;
  }

  it('should be created', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy('component should be created');
  });

  /* this gets a list of the top-level html element tag names and compares that with an expected list */
  it('should display other components', async () => {
    const { page, expected } = await setup();
    const pageHtmlTags = page.getTopLevelTags();
    /* the page tags list and the expected list should match */
    expect(pageHtmlTags).toEqual(
      expected.htmlTags,
      'page should have expected html tags',
    );
  });
});
