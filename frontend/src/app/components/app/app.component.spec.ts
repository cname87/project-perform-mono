import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MessagesComponent } from '../messages/messages.component';
import { RouterLinkDirectiveStub, click } from '../../shared/test-helpers';
import { DebugElement } from '@angular/core';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let linkDes: DebugElement[];
  let routerLinks: RouterLinkDirectiveStub[];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent, MessagesComponent, RouterLinkDirectiveStub],
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'members', component: AppComponent }, // dummy path needed to avoid routing error warning
        ]),
      ],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    /* find DebugElements with an attached RouterLinkStubDirective */
    linkDes = fixture.debugElement.queryAll(
      By.directive(RouterLinkDirectiveStub),
    );

    /* get link directive instances using each DebugElement's injector */
    routerLinks = linkDes.map((de) => de.injector.get(RouterLinkDirectiveStub));

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Top Members" as headline', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toEqual(
      component.title,
    );
  });

  it('should display 2 links', async(() => {
    expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(2);
  }));

  it('can get RouterLinks from template', () => {
    expect(routerLinks.length).toBe(2, 'should have 2 routerLinks');
    expect(routerLinks[0].linkParams).toBe(
      `/${component.dashboard.path}`,
      'dashboard route',
    );
    expect(routerLinks[1].linkParams).toBe(
      `/${component.members.path}`,
      'members route',
    );
  });

  it('can click Members link in template', () => {
    const membersLinkDe = linkDes[1];
    const membersLink = routerLinks[1];

    expect(membersLink.navigatedTo).toBeNull('should not have navigated yet');

    fixture.ngZone!.run(() => {
      click(membersLinkDe);
    });
    fixture.detectChanges();

    /* it attempts to route => dummy path configured above */
    expect(membersLink.navigatedTo).toBe(
      `/${component.members.path}`,
      'members route',
    );
  });
});
