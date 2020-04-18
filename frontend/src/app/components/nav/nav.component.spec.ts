/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { APP_BASE_HREF } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NGXLogger } from 'ngx-logger';

import { By } from '@angular/platform-browser';
import { AppModule } from '../../app.module';
import { NavComponent } from './nav.component';
import { AuthService } from '../../shared/auth.service/auth.service';
import {
  click,
  findRouterLinks,
  RouterLinkDirectiveStub,
} from '../../shared/test-helpers';

/* spy interfaces */
interface IAuthServiceSpy {
  isLoggedIn: boolean;
}
let authService: any = {};

describe('NavComponent', () => {
  /* create the base mocks that will replace services */
  function createBaseMocks(isAuthenticated = true) {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    const authServiceSpy = {
      isLoggedIn: isAuthenticated,
    };
    return {
      loggerSpy,
      authServiceSpy,
    };
  }
  async function mainSetup(isAuthenticated = true) {
    const { loggerSpy, authServiceSpy } = createBaseMocks(isAuthenticated);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NGXLogger, useValue: loggerSpy },
      ],
    })
      .overrideModule(AppModule, {
        add: {
          /* must declare RouterLinkDirective in AppModule override */
          declarations: [RouterLinkDirectiveStub],
        },
      })
      .compileComponents();
  }

  /* get key DOM elements */
  class Page {
    /* find DebugElements with an attached RouterLinkStubDirective */
    /* need to use debug elements as clicking on a disabled link on a html element appears to throw a ZoneAware error */
    get anchorDebugElements() {
      return this.fixture.debugElement.queryAll(
        By.directive(RouterLinkDirectiveStub),
      );
    }

    /* gets all the routerLink directive instances */
    get routerLinks() {
      return findRouterLinks<RouterLinkDirectiveStub>(
        this.fixture,
        RouterLinkDirectiveStub,
      );
    }

    constructor(readonly fixture: ComponentFixture<NavComponent>) {}
  }

  function createExpected() {
    return {
      numLinks: 3,
    };
  }

  /* create the component, and get test variables */
  function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(NavComponent);

    /* get the injected instances */
    const { injector } = fixture.debugElement;
    authService = injector.get<IAuthServiceSpy>(AuthService as any);

    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      authService,
      expected,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup(isAuthenticated = true) {
    await mainSetup(isAuthenticated);
    const testVars = createComponent();
    return testVars;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup(isAuthenticated = true) {
    const testVars = await preSetup(isAuthenticated);
    /* initiate ngOnInit and view changes etc */
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    return testVars;
  }

  describe('after ngOnInit', () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });

    it('can get RouterLinks from template', async () => {
      const { page, expected } = await setup();
      expect(page.routerLinks.length).toBe(
        expected.numLinks,
        'should have expected # of routerLinks',
      );
      expect(page.routerLinks[0].linkParams).toBe(
        '/dashboard',
        'dashboard route',
      );
      expect(page.routerLinks[1].linkParams).toBe(
        '/memberslist',
        'members route',
      );
      expect(page.routerLinks[2].linkParams).toBe(
        '/detail',
        'detail route (disabled)',
      );
    });

    it('can click Dashboard link in template', async () => {
      const { component, fixture, page } = await setup();
      const dashboardDe = page.anchorDebugElements[0];
      const dashboardLink = page.routerLinks[0];

      /* link is not disabled */
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(dashboardDe.attributes['ng-reflect-disabled']).toBeNull;
      expect(dashboardLink.navigatedTo).toBeNull(
        'should not have navigated yet',
      );

      /* ngZone needed to avoid an error */
      fixture.ngZone!.run(() => {
        click(dashboardDe);
      });
      fixture.detectChanges();
      await fixture.whenStable();

      /* it attempts to route => dummy path configured above */
      expect(dashboardLink.navigatedTo).toBe(
        `/${(component as any).dashboard.path}`,
        'dashboard route passed to routerLink',
      );

      /* test only dashboard nav link is routed */
      expect(page.routerLinks[1].navigatedTo).toBe(null);
    });

    it('when not authenticated can click Dashboard link but not route', async () => {
      /* set to not authenticated */
      const { component, fixture, page } = await setup(false);
      const dashboardDe = page.anchorDebugElements[0];
      const dashboardLink = page.routerLinks[0];

      /* disabled attribute should be true */
      expect(dashboardDe.attributes['ng-reflect-disabled']).toBe('true');
      expect(dashboardLink.navigatedTo).toBeNull(
        'should not have navigated yet',
      );

      /* note: clicking on a disabled html element throws an error => using the debug element */
      /* ngZone needed to avoid an error */
      fixture.ngZone!.run(() => {
        click(dashboardDe);
      });
      fixture.detectChanges();
      await fixture.whenStable();

      /* routerLink gets the route but it does not attempt to route (as disabled) => no dummy path configured above */
      expect(dashboardLink.navigatedTo).toEqual(
        `/${(component as any).dashboard.path}`,
        'dashboard route passed to routerLink',
      );

      /* test memberslist not routed */
      expect(page.routerLinks[1].navigatedTo).toBe(null);
    });

    it('can click Members link in template', async () => {
      const { component, fixture, page } = await setup();
      const membersLinkDe = page.anchorDebugElements[1];
      const membersLink = page.routerLinks[1];

      /* link is not disabled */
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(membersLinkDe.attributes['ng-reflect-disabled']).toBeNull;
      expect(membersLink.navigatedTo).toBeNull('should not have navigated yet');

      /* ngZone needed to avoid an error */
      fixture.ngZone!.run(() => {
        click(membersLinkDe);
      });
      fixture.detectChanges();
      await fixture.whenStable();

      /* it attempts to route => dummy path configured above */
      expect(membersLink.navigatedTo).toBe(
        `/${(component as any).membersList.path}`,
        'members route passed to routerLink',
      );

      /* test only memberslist nav link is routed */
      expect(page.routerLinks[0].navigatedTo).toBe(null);
    });

    it('can click Detail link but not route', async () => {
      const { component, fixture, page } = await setup();
      const detailDe = page.anchorDebugElements[2];
      const detailLink = page.routerLinks[2];

      /* disabled attribute should be true */
      expect(detailDe.attributes['ng-reflect-disabled']).toBe('true');
      expect(detailLink.navigatedTo).toBeNull('should not have navigated yet');

      /* note: clicking on a disabled html element throws an error => using the debug element */
      /* ngZone needed to avoid an error */
      fixture.ngZone!.run(() => {
        click(detailDe);
      });
      fixture.detectChanges();
      await fixture.whenStable();

      /* routerLink gets the route but it does not attempt to route (as disabled) => no dummy path configured above */
      expect(detailLink.navigatedTo).toEqual(
        `/${(component as any).detail.path}`,
        'detail route passed to routerLInk',
      );

      /* test dashboard or memberslist not routed */
      expect(page.routerLinks[0].navigatedTo).toBe(null);
      expect(page.routerLinks[1].navigatedTo).toBe(null);
    });

    it('should test trackBy function returns link.path', async () => {
      const { component } = await setup();
      const result = component.trackByFn(0, component.links[0]);
      expect(result).toBe(component.links[0].path, 'returns link path');
    });

    it('should test trackBy function returns null', async () => {
      const { component } = await setup();
      const result = component.trackByFn(0, null as any);
      expect(result).toBeNull('returns null');
    });
  });
});
