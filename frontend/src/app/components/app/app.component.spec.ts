import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterLinkDirectiveStub, click } from '../../shared/test-helpers';
import { MaterialModule } from '../../modules/material/material.module';
import { AppModule } from '../../app.module';
import { APP_BASE_HREF } from '@angular/common';

describe('AppComponent', () => {
  /* setup function run by each 'it' test suite */
  async function mainSetup() {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        AppModule,
        RouterTestingModule.withRoutes([
          { path: 'memberslist', component: AppComponent }, // dummy path needed to avoid routing error warning
        ]),
        MaterialModule,
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
      ],
    }).compileComponents();
  }

  class Page {
    /* find DebugElements with an attached RouterLinkStubDirective */
    get linkDes() {
      return this.fixture.debugElement.queryAll(
        By.directive(RouterLinkDirectiveStub),
      );
    }

    /* get link directive instances using each DebugElement's injector */
    get routerLinks() {
      return this.linkDes.map((de) => de.injector.get(RouterLinkDirectiveStub));
    }

    get header() {
      return this.findClass<HTMLDivElement>('mat-display-1') as HTMLDivElement;
    }

    get anchorLinks() {
      return this.fixture.nativeElement.querySelectorAll('a');
    }

    constructor(readonly fixture: ComponentFixture<AppComponent>) {}

    private findClass<T>(cls: string): T {
      const element = this.fixture.debugElement.query(By.css('.' + cls));
      if (!element) {
        return (null as unknown) as T;
      }
      return element.nativeElement;
    }
  }

  /* create the component, initialize it & return test variables */
  async function createComponent() {
    const fixture = TestBed.createComponent(AppComponent);

    /* create the component instance */
    const component = fixture.componentInstance;

    /* ngOnInit and any view, binding etc */
    await fixture.detectChanges();
    await fixture.detectChanges();

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
    };
  }

  /* setup function run by each sub test function */
  async function setup() {
    await mainSetup();
    return createComponent();
  }

  it('should be created', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy('component should be created');
  });

  it('should display header', async () => {
    const { component, page } = await setup();
    expect(page.header.textContent).toBe(component.header, 'page header');
  });

  it('should display 3 links', async () => {
    const { page } = await setup();
    expect(page.anchorLinks.length).toBe(3, '3 anchor elements on DOM');
  });

  it('can get RouterLinks from template', async () => {
    const { component, page } = await setup();
    expect(page.routerLinks.length).toBe(3, 'should have 3 routerLinks');
    expect(page.routerLinks[0].linkParams).toBe(
      `/${component['dashboard'].path}`,
      'dashboard route',
    );
    expect(page.routerLinks[1].linkParams).toBe(
      `/${component['membersList'].path}`,
      'members route',
    );
    expect(page.routerLinks[2].linkParams).toBe(
      `/${component['detail'].path}`,
      'detail route (disabled',
    );
  });

  it('can click Dashboard link in template', async () => {
    const { component, fixture, page } = await setup();
    const dashboardDe = page.linkDes[0];
    const dashboardLink = page.routerLinks[0];

    /* link is not disabled */
    expect(await dashboardDe.attributes['ng-reflect-disabled']).toBeNull;
    expect(dashboardLink.navigatedTo).toBeNull('should not have navigated yet');

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
    const membersLinkDe = page.linkDes[1];
    const membersLink = page.routerLinks[1];

    /* link is not disabled */
    expect(await membersLinkDe.attributes['ng-reflect-disabled']).toBeNull;
    expect(membersLink.navigatedTo).toBeNull('should not have navigated yet');

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
    const detailDe = page.linkDes[2];
    const detailLink = page.routerLinks[2];

    /* disabled attribute should be true */
    expect(await detailDe.attributes['ng-reflect-disabled']).toBe('true');
    expect(detailLink.navigatedTo).toBeNull('should not have navigated yet');

    fixture.ngZone!.run(() => {
      click(detailDe);
    });
    await fixture.detectChanges();

    /* routerLink gets the route but it does not attempt to route (as disabled ) => no dummy path configured above */
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
