import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { By } from '@angular/platform-browser';

import { AppModule } from '../../app.module';
import { MemberCardComponent } from './member-card.component';

describe('memberCardComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
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
   * Create the MemberDetailComponent, initialize it, set test variables.
   */
  async function createComponent() {
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

  describe('component', async () => {
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
      expect(await page.content.innerText).toBe(
        'Name: test name',
        'name shown',
      );
    });
  });
});
