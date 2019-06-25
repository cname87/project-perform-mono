import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF, Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { ErrorInformationComponent } from './error-information.component';
import {
  findId,
  findTag,
  ActivatedRoute,
  ActivatedRouteStub,
  click,
} from '../../shared/test-helpers';

interface ILocationSpy {
  back: jasmine.Spy;
}

describe('ErrorInformationComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* stub ActivatedRoute with a configurable path parameter */
    const activatedRouteStub = new ActivatedRouteStub('notfound');
    /* stub Location service */
    const locationSpy = jasmine.createSpyObj('location', ['back']);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Location, useValue: locationSpy },
      ],
    }).compileComponents();
  }

  class Page {
    /* get DOM elements */
    get header() {
      return findTag<HTMLElement>(this.fixture, 'mat-card-title');
    }
    get hint() {
      return findTag<HTMLElement>(this.fixture, 'mat-card-subtitle');
    }
    get goBackButton() {
      return findId<HTMLButtonElement>(this.fixture, 'goBackBtn');
    }

    constructor(
      readonly fixture: ComponentFixture<ErrorInformationComponent>,
    ) {}
  }

  function createSpies(locationSpy: ILocationSpy) {
    const backSpy = locationSpy.back.and.stub();

    return { backSpy };
  }

  /**
   * Create the ErrorInformationComponent, initialize it, set test variables.
   */
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(ErrorInformationComponent);

    /* get the injected instances */
    /* angular.io guide suggests you need to get these from injector.get.  It seemed to work when I just used the 'useValues' in configureTestingModule but now implementing as per guide */
    const locationSpy = fixture.debugElement.injector.get<ILocationSpy>(
      Location as any,
    );
    const activatedRouteStub = fixture.debugElement.injector.get<
      ActivatedRouteStub
    >(ActivatedRoute as any);

    /* create the component instance */
    const component = fixture.componentInstance;
    /* do not run fixture.detectChanges (i.e. ngOnIt here) as included below */

    const { backSpy } = createSpies(locationSpy);

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      backSpy,
      activatedRouteStub,
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

    it('should have the default header', async () => {
      const { component, fixture } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* test */
      expect(component.header).toEqual('Page Not Found');
    });

    it('should have the default hint', async () => {
      const { component, fixture } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* test */
      expect(component.hint).toEqual('Click on a tab link above');
    });

    it('should have mode set by route', async () => {
      const { component, fixture, activatedRouteStub } = await setup();
      const routeMode = 'test';
      activatedRouteStub.setParameter(routeMode);
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* test */
      expect(component['mode']).toEqual(routeMode);
    });

    it('should call goBack', async () => {
      const { component, fixture, backSpy } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* manually call goBack() */
      component.goBack();
      /* test */
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('page', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should show the add mode values on start up', async () => {
      const { component, fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeMode = '';
      activatedRouteStub.setParameter(routeMode);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.header.innerText).toBe(component.header.toUpperCase());
      expect(page.hint.innerText).toBe(component.hint);
    });

    it('should show the edit mode values on start up', async () => {
      const { component, fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeMode = 'edit';
      activatedRouteStub.setParameter(routeMode);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.header.innerText).toBe(component.header.toUpperCase());
      expect(page.hint.innerText).toBe(component.hint);
    });

    it('should show the header in uppercase', async () => {
      const { component, fixture, page } = await setup();
      /* set up a dummy header */
      component.header = 'test';
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.header.innerText).toBe('TEST');
    });

    it('should click the go back button', async () => {
      const { fixture, page, backSpy, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 'edit';
      activatedRouteStub.setParameter(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      /* click the go back button */
      click(page.goBackButton);
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });
});
