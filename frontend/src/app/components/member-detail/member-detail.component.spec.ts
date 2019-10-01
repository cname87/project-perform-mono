import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF, Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { MemberDetailComponent } from './member-detail.component';
import { MembersService } from '../../shared/members-service/members.service';
import {
  findId,
  findTag,
  asyncData,
  ActivatedRoute,
  ActivatedRouteStub,
  click,
} from '../../shared/test-helpers';
import { IMember } from '../../data-providers/members.data-provider';
import { members } from '../../shared/mocks/mock-members';

interface IMembersServiceSpy {
  updateMember: jasmine.Spy;
}
interface ILocationSpy {
  back: jasmine.Spy;
}
interface IErrorHandlerSpy {
  handleError: jasmine.Spy;
}

describe('MemberDetailComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup(routeId = 0) {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);
    /* create spies on memberService methods */
    const membersServiceSpy = jasmine.createSpyObj('membersService', [
      'updateMember',
    ]);
    /* stub ActivatedRoute with a configurable path parameter */
    const activatedRouteStub = new ActivatedRouteStub(routeId);
    /* stub Location service */
    const locationSpy = jasmine.createSpyObj('location', ['back']);
    const errorHandlerSpy = jasmine.createSpyObj('errorHandler', [
      'handleError',
    ]);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: MembersService, useValue: membersServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Location, useValue: locationSpy },
        { provide: ErrorHandler, useValue: errorHandlerSpy },
        { provide: NGXLogger, useValue: loggerSpy },
      ],
    }).compileComponents();
  }

  class Page {
    /* get DOM elements */
    get header() {
      return findTag<HTMLElement>(this.fixture, 'mat-card-title');
    }
    get nameDisplay() {
      return findId<HTMLSpanElement>(this.fixture, 'memberName');
    }
    get idDisplay() {
      return findId<HTMLSpanElement>(this.fixture, 'memberId');
    }
    get goBackButton() {
      return findId<HTMLButtonElement>(this.fixture, 'goBackBtn');
    }
    get memberInput() {
      return findTag<HTMLElement>(this.fixture, 'app-member-input');
    }

    constructor(readonly fixture: ComponentFixture<MemberDetailComponent>) {}
  }

  /**
   * List all expected 'magic' values here to be used in tests.
   */
  function expected() {
    return {
      memberName: 'test',
    };
  }

  function createSpies(
    memberServiceSpy: IMembersServiceSpy,
    locationSpy: ILocationSpy,
    errorHandlerSpy: IErrorHandlerSpy,
  ) {
    const updateMemberSpy = memberServiceSpy.updateMember.and.callFake(() => {
      /* return as expected */
      return asyncData('');
    });

    const backSpy = locationSpy.back.and.stub();

    const handleErrorSpy = errorHandlerSpy.handleError.and.stub();

    return { updateMemberSpy, backSpy, handleErrorSpy };
  }

  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(MemberDetailComponent);

    /* get the injected instances */
    /* angular.io guide suggests you need to get these from injector.get.  It seemed to work when I just used the 'useValues' in configureTestingModule but now implementing as per guide */
    const membersServiceSpy = fixture.debugElement.injector.get<
      IMembersServiceSpy
    >(MembersService as any);
    const locationSpy = fixture.debugElement.injector.get<ILocationSpy>(
      Location as any,
    );
    const activatedRouteStub = fixture.debugElement.injector.get<
      ActivatedRouteStub
    >(ActivatedRoute as any);
    const errorHandlerSpy = fixture.debugElement.injector.get<IErrorHandlerSpy>(
      ErrorHandler as any,
    );

    /* create the component instance */
    const component = fixture.componentInstance;
    /* do not run fixture.detectChanges (i.e. ngOnIt here) as included below */

    const { updateMemberSpy, backSpy, handleErrorSpy } = createSpies(
      membersServiceSpy,
      locationSpy,
      errorHandlerSpy,
    );

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      updateMemberSpy,
      backSpy,
      handleErrorSpy,
      activatedRouteStub,
      /* give access to expected magic vales */
      ...expected(),
    };
  }

  describe('component', async () => {
    /* setup function run by each sub test function */
    async function setup(routeId = 0) {
      await mainSetup(routeId);
      return createComponent();
    }

    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should have the right member after ngOnInit called', async () => {
      /* set up route that the component will get */
      const routeId = 5;
      const { component, fixture } = await setup(routeId);
      /* initiate ngOnInit */
      fixture.detectChanges();
      await fixture.whenStable();
      /* note that component.member$ will complete once the page displays and all subscriptions complete => we access before .whenStable() */
      component.member$.subscribe((member: IMember) => {
        expect(member.name).toBe(members[routeId].name);
      });
    });

    it('should call goBack', async () => {
      const { component, fixture, backSpy } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      await fixture.whenStable();
      /* await asyncData call */
      fixture.detectChanges();
      await fixture.whenStable();
      /* manually call goBack() */
      component.goBack();
      /* test */
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('should call save() and return', async () => {
      const { component, fixture, updateMemberSpy, backSpy } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      await fixture.whenStable();
      /* await asyncData call */
      fixture.detectChanges();
      await fixture.whenStable();
      /* manually call save() with the user name */
      component.save('', '1');
      /* await async data return */
      fixture.detectChanges();
      await fixture.whenStable();
      /* updateMember not called */
      expect(updateMemberSpy).toHaveBeenCalledTimes(0);
      expect(backSpy).toHaveBeenCalledTimes(0);
    });

    it('should call save() and call member update function', async () => {
      /* set up route that the component will get */
      const routeId = 6;
      const { component, fixture, updateMemberSpy, backSpy } = await setup(
        routeId,
      );
      /* initiate ngOnInit */
      fixture.detectChanges();
      await fixture.whenStable();
      /* await asyncData call */
      fixture.detectChanges();
      await fixture.whenStable();
      /* manually call save() with the user name */
      component.save(members[routeId].name, routeId.toString());
      /* await async data return */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(updateMemberSpy).toHaveBeenCalledTimes(1);
      expect(updateMemberSpy).toHaveBeenCalledWith({
        id: routeId,
        name: members[routeId].name,
      });
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('page', async () => {
    /* setup function run by each sub test function */
    async function setup(routeId = 0) {
      await mainSetup(routeId);
      return createComponent();
    }

    it('should show the right values on start up', async () => {
      /* set up route that the component will get */
      const routeId = 8;
      const { fixture, page } = await setup(routeId);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* data bind to & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      /* test header, name and id */
      expect(page.header.innerText).toEqual(
        members[routeId].name.toUpperCase(),
        'header',
      );
      expect(page.nameDisplay.innerText).toEqual(
        'NAME: ' + members[routeId].name,
        'name',
      );
      expect(page.idDisplay.innerText).toEqual(
        'ID: ' + members[routeId].id,
        'id',
      );
      /* test the mode attribute in the member input element */
      const mode = page.memberInput.attributes.getNamedItem('ng-reflect-mode');
      expect(mode!.value).toBe('edit', 'input box is set to edit mode');
      /* test the text in the input element */
      const text = page.memberInput.attributes.getNamedItem(
        'ng-reflect-input-text',
      );
      expect(text!.value).toBe(
        members[routeId].name,
        'input box value is set to the supplied name',
      );
    });

    it('should call save with the right parameters on input event', async () => {
      /* set up route that the component will get */
      const routeId = 3;
      const {
        component,
        fixture,
        page,
        updateMemberSpy,
        backSpy,
      } = await setup(routeId);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* data bind to & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      /* stub on the save() method */
      const saveSpy = spyOn(component, 'save').and.callThrough();
      /* get the input element */
      const input = page.memberInput;
      /* dispatch an 'inputEnter' event to the member input element */
      const inputEvent: any = new Event('inputEnter');
      input.dispatchEvent(inputEvent);
      /* test that save() was called with the event and the id string */
      /* note: the '$event' emitted by the input box inputEnter event is the event passed in and not the input box name */
      expect(saveSpy).toHaveBeenCalledWith(
        inputEvent,
        members[routeId].id.toString(),
      );
      /* await async data return */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(updateMemberSpy).toHaveBeenCalledTimes(1);
      expect(updateMemberSpy).toHaveBeenCalledWith({
        id: members[routeId].id,
        name: inputEvent, // not memberName
      });
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('should call go back on clicking go back button', async () => {
      const { fixture, page, backSpy } = await setup();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* click the go back button */
      click(page.goBackButton);
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });
});
