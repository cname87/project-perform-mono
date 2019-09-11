import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF, Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { InformationComponent } from './information.component';
import {
  findId,
  findTag,
  ActivatedRoute,
  ActivatedRouteStub,
  click,
} from '../../shared/test-helpers';
import { AuthService } from '../../shared/auth.service/auth.service';

interface ILocationSpy {
  back: jasmine.Spy;
}

interface IAuthServiceSpy {
  isLoggedIn: boolean;
}
describe('InformationComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    /* stub ActivatedRoute with a configurable path parameter */
    const activatedRouteStub = new ActivatedRouteStub('notfound');
    /* stub Location service */
    const locationSpy = jasmine.createSpyObj('location', ['back']);
    /* stub authService isAuthenticated property - define spy strategy below */
    let authServiceSpy = jasmine.createSpyObj('authService', ['dummy']);
    authServiceSpy = {
      ...authServiceSpy,
      isLoggedIn: true,
    };

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
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NGXLogger, useValue: loggerSpy },
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

    constructor(readonly fixture: ComponentFixture<InformationComponent>) {}
  }

  function createSpies(
    locationSpy: ILocationSpy,
    authServiceSpy: IAuthServiceSpy,
    isAuthenticated = true,
  ) {
    const backSpy = locationSpy.back.and.stub();

    authServiceSpy.isLoggedIn = isAuthenticated;
    const isAuthenticatedSpy = authServiceSpy.isLoggedIn;

    return {
      backSpy,
      isAuthenticatedSpy,
    };
  }

  /**
   * Create the InformationComponent, initialize it, set test variables.
   */
  async function createComponent(isAuthenticated = true) {
    /* create the fixture */
    const fixture = TestBed.createComponent(InformationComponent);

    /* get the injected instances */
    /* angular.io guide suggests you need to get these from injector.get.  It seemed to work when I just used the 'useValues' in configureTestingModule but now implementing as per guide */
    const locationSpy = fixture.debugElement.injector.get<ILocationSpy>(
      Location as any,
    );
    const activatedRouteStub = fixture.debugElement.injector.get<
      ActivatedRouteStub
    >(ActivatedRoute as any);
    const authServiceSpy = fixture.debugElement.injector.get<IAuthServiceSpy>(
      AuthService as any,
    );

    /* create the component instance */
    const component = fixture.componentInstance;
    /* do not run fixture.detectChanges (i.e. ngOnIt here) as included below */

    const { backSpy } = createSpies(
      locationSpy,
      authServiceSpy,
      isAuthenticated,
    );

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

  /* setup function run by each sub test function */
  async function setup(isAuthenticated = true) {
    await mainSetup();
    return createComponent(isAuthenticated);
  }

  describe('component', async () => {
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
    it('should show the not found values by default', async () => {
      const { fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeMode = '';
      activatedRouteStub.setParameter(routeMode);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.header.innerText).toBe('PAGE NOT FOUND');
      expect(page.hint.innerText).toBe('Click on a tab link above');
    });

    it('should show the error values if error mode is set', async () => {
      const { fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeMode = 'error';
      activatedRouteStub.setParameter(routeMode);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.header.innerText).toBe('UNEXPECTED ERROR!');
      expect(page.hint.innerText).toBe('Click on a tab link above');
    });

    it('should show the login values if login mode is set and app is not authenticated ', async () => {
      const { fixture, page, activatedRouteStub } = await setup(false);
      /* set up route that the component will get */
      const routeMode = 'login';
      activatedRouteStub.setParameter(routeMode);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.header.innerText).toBe('LOG IN');
      expect(page.hint.innerText).toBe('Click on the Log In button above');
    });

    it('should show the logout values if login mode is set and app is authenticated ', async () => {
      const { fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeMode = 'login';
      activatedRouteStub.setParameter(routeMode);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.header.innerText).toBe('LOG OUT');
      expect(page.hint.innerText).toBe(
        'Click on the log out button above (or click on a link above)',
      );
    });

    it('should show the header in uppercase', async () => {
      const { component, fixture, page } = await setup();
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* set up a dummy header */
      component.header = 'test';
      /* await data binding */
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
