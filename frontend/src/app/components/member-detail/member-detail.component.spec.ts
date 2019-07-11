import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF, Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { ErrorHandler } from '@angular/core';

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
  asyncError,
} from '../../shared/test-helpers';
import { IMember } from '../../data-providers/members.data-provider';

interface IMembersServiceSpy {
  getMember: jasmine.Spy;
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
  async function mainSetup() {
    /* create spies on memberService methods */
    const membersServiceSpy = jasmine.createSpyObj('membersService', [
      'getMember',
      'updateMember',
    ]);
    /* stub ActivatedRoute with a configurable path parameter */
    const activatedRouteStub = new ActivatedRouteStub(0);
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
    isError = false,
  ) {
    const getMemberSpy = memberServiceSpy.getMember.and.callFake(
      (id: number) => {
        /* return a member unless an input flag parameter is set in which case an error is returned. */
        return isError
          ? asyncError(new Error('Test Error'))
          : asyncData({ id, name: expected().memberName + id });
      },
    );
    const updateMemberSpy = memberServiceSpy.updateMember.and.callFake(() => {
      /* return as expected */
      return asyncData('');
    });

    const backSpy = locationSpy.back.and.stub();

    const handleErrorSpy = errorHandlerSpy.handleError.and.stub();

    return { getMemberSpy, updateMemberSpy, backSpy, handleErrorSpy };
  }

  async function createComponent(isError = false) {
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

    const {
      getMemberSpy,
      updateMemberSpy,
      backSpy,
      handleErrorSpy,
    } = createSpies(membersServiceSpy, locationSpy, errorHandlerSpy, isError);

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      getMemberSpy,
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
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should have the default member before ngOnInit called', async () => {
      const { component } = await setup();
      component.member$.subscribe((member: IMember) => {
        expect(member).toEqual({ id: 0, name: '' });
      });
    });

    it('should have the right member after ngOnInit called', async () => {
      const {
        component,
        fixture,
        memberName,
        activatedRouteStub,
      } = await setup();
      /* set up route that the component will get */
      const routeId = 1;
      activatedRouteStub.setParameter(routeId);
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* note that component.member$ will complete once the page displays and all subscriptions complete => we access before .whenStable() */
      component.member$.subscribe((member: IMember) => {
        expect(member.name).toBe(memberName + routeId);
      });
    });

    it('should call goBack', async () => {
      const { component, fixture, backSpy, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 1;
      activatedRouteStub.setParameter(routeId);
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
      const {
        component,
        fixture,
        memberName,
        updateMemberSpy,
        backSpy,
        activatedRouteStub,
      } = await setup();
      /* set up route that the component will get */
      const routeId = 2;
      activatedRouteStub.setParameter(routeId);
      /* initiate ngOnInit */
      fixture.detectChanges();
      await fixture.whenStable();
      /* await asyncData call */
      fixture.detectChanges();
      await fixture.whenStable();
      /* manually call save() with the user name */
      component.save(memberName + routeId, routeId.toString());
      /* await async data return */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(updateMemberSpy).toHaveBeenCalledTimes(1);
      expect(updateMemberSpy).toHaveBeenCalledWith({
        id: routeId,
        name: memberName + routeId,
      });
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('page', async () => {
    /* setup function run by each sub test function */
    async function setup(isError = false) {
      await mainSetup();
      return createComponent(isError);
    }

    it('should show the right values on start up', async () => {
      const { fixture, page, memberName, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 2;
      activatedRouteStub.setParameter(routeId);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* data bind to & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      /* test header, name and id */
      expect(page.header.innerText).toBe(
        memberName.toUpperCase() + routeId,
        'header',
      );
      expect(page.nameDisplay.innerText).toEqual(
        'NAME: ' + memberName + routeId,
        'name',
      );
      expect(page.idDisplay.innerText).toEqual('ID: ' + routeId, 'id');
      /* test the mode attribute in the member input element */
      const mode = page.memberInput.attributes.getNamedItem('ng-reflect-mode');
      expect(mode!.value).toBe('edit', 'input box is set to edit mode');
      /* test the text in the input element */
      const text = page.memberInput.attributes.getNamedItem(
        'ng-reflect-input-text',
      );
      expect(text!.value).toBe(
        memberName + routeId,
        'input box value is set to the supplied name',
      );
    });

    it('should call save with the right parameters on input event', async () => {
      const {
        component,
        fixture,
        page,
        updateMemberSpy,
        backSpy,
        activatedRouteStub,
      } = await setup();
      /* set up route that the component will get */
      const routeId = 2;
      activatedRouteStub.setParameter(routeId);
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
      const inputEvent = new Event('inputEnter');
      input.dispatchEvent(inputEvent);
      /* test that save() was called with the event and the id string */
      /* note: the '$event' emitted by the input box inputEnter event is the event passed in and not the input box name */
      expect(saveSpy).toHaveBeenCalledWith(inputEvent, routeId.toString());
      /* await async data return */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(updateMemberSpy).toHaveBeenCalledTimes(1);
      expect(updateMemberSpy).toHaveBeenCalledWith({
        id: routeId,
        name: inputEvent, // not memberName
      });
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('should call go back on clicking go back button', async () => {
      const { fixture, page, backSpy, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 4;
      activatedRouteStub.setParameter(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* click the go back button */
      click(page.goBackButton);
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle a getMember error', async () => {
      /* set getMemberSpy to return an error */
      const {
        component,
        fixture,
        page,
        getMemberSpy,
        handleErrorSpy,
      } = await setup(true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(getMemberSpy).toHaveBeenCalledTimes(1);
      const spyCalls = 1;
      expect(handleErrorSpy).toHaveBeenCalledTimes(spyCalls);
      /* test that handleError called with the thrown error */
      expect(handleErrorSpy.calls.argsFor(0)[0].message).toBe('Test Error');
      /* check dummy member shown */
      expect(page.idDisplay.innerText).toEqual('ID: 0');
      /* subscribe to the getMembers observable again */
      const numReturned = await component.member$.toPromise();
      /* this time test that an empty array returned */
      expect(numReturned).toEqual({ id: 0, name: '' });
      /* check handleError still only called once */
      expect(handleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
