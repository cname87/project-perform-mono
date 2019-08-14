import { APP_BASE_HREF } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { NavComponent } from './nav.component';
import { AuthService } from '../../shared/auth.service/auth.service';
import {
  click,
  findRouterLinks,
  RouterLinkDirectiveStub,
} from '../../shared/test-helpers';
import { By } from '@angular/platform-browser';
import { AppRoutingModule } from '../../router/app.routing.module';

/* spy interfaces */
interface IAuthServiceSpy {
  isAuthenticated: jasmine.Spy;
}

describe('NavComponent', () => {
  /* setup function run by each sub test suite*/
  async function mainSetup() {
    /* stub authService - define spy strategy below */
    let authServiceSpy = jasmine.createSpyObj('authService', ['dummy']);
    /* stub authService property isAuthenticated - define values below */
    authServiceSpy = {
      ...authServiceSpy,
      isAuthenticated: {},
    };

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: AuthService, useValue: authServiceSpy },
      ],
    })
      .overrideModule(AppModule, {
        remove: {
          /* removing router module and replacing it below to avoid spurious errors in authGuard etc */
          imports: [AppRoutingModule],
        },
        add: {
          /* declare RouterLinkDirective in AppModule override (rather than declaring it in AppModule). Declaring locally whilst importing AppModule appears not to work) */
          declarations: [RouterLinkDirectiveStub],
          /* adding RouterTestingModule and sending all paths to a dummy component */
          imports: [
            RouterTestingModule.withRoutes([
              { path: '**', component: NavComponent },
            ]),
          ],
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

  function createSpies(
    authServiceSpy: IAuthServiceSpy,
    component: NavComponent,
  ) {
    /* stub isAuthenticated property to stub isAuthenticated.subscribe() */
    authServiceSpy.isAuthenticated = ({
      subscribe: (fn: (value: boolean) => void) => {
        fn(true);
        return component;
      },
    } as any) as jasmine.Spy<InferableFunction>;
    return {};
  }

  function createExpected() {
    return {
      numLinks: 3,
    };
  }

  /* create the component, and get test variables */
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(NavComponent);

    /* get the injected instances */
    const injector = fixture.debugElement.injector;
    const authServiceSpy = injector.get<IAuthServiceSpy>(AuthService as any);

    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* get the spies */
    const {} = createSpies(authServiceSpy, component);

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
    const testVars = await createComponent();
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

  describe('after ngOnInit', async () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });

    it('isAuthenticated should be true', async () => {
      const { component } = await setup();
      expect(component.isAuthenticated).toBeTruthy('isAuthenticated set');
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
      expect(await dashboardDe.attributes['ng-reflect-disabled']).toBeNull;
      expect(dashboardLink.navigatedTo).toBeNull(
        'should not have navigated yet',
      );

      /* ngZone needed to avoid an error */
      fixture.ngZone!.run(() => {
        click(dashboardDe);
      });
      await fixture.detectChanges();

      /* it attempts to route => dummy path configured above */
      expect(dashboardLink.navigatedTo).toBe(
        `/${component['dashboard'].path}`,
        'dashboard route passed to routerLink',
      );

      /* test only dashboard nav link is routed */
      expect(page.routerLinks[1].navigatedTo).toBe(null);
    });

    it('can click Members link in template', async () => {
      const { component, fixture, page } = await setup();
      const membersLinkDe = page.anchorDebugElements[1];
      const membersLink = page.routerLinks[1];

      /* link is not disabled */
      expect(await membersLinkDe.attributes['ng-reflect-disabled']).toBeNull;
      expect(membersLink.navigatedTo).toBeNull('should not have navigated yet');

      /* ngZone needed to avoid an error */
      fixture.ngZone!.run(() => {
        click(membersLinkDe);
      });
      await fixture.detectChanges();

      /* it attempts to route => dummy path configured above */
      expect(membersLink.navigatedTo).toBe(
        `/${component['membersList'].path}`,
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
      expect(await detailDe.attributes['ng-reflect-disabled']).toBe('true');
      expect(detailLink.navigatedTo).toBeNull('should not have navigated yet');

      /* note: clicking on a disabled html element throws an error => using the debug element */
      /* ngZone needed to avoid an error */
      fixture.ngZone!.run(() => {
        click(detailDe);
      });
      await fixture.detectChanges();
      await fixture.whenStable();

      /* routerLink gets the route but it does not attempt to route (as disabled) => no dummy path configured above */
      expect(detailLink.navigatedTo).toEqual(
        `/${component['detail'].path}`,
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
