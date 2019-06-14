import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF, Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { MemberDetailComponent } from './member-detail.component';
import { MembersService } from '../../shared/services/members.service';
import {
  findId,
  findTag,
  asyncData,
  ActivatedRoute,
  ActivatedRouteSnapshotStub,
  click,
} from '../../shared/test-helpers';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IMember } from '../../api/api-members.service';

interface IMembersServiceSpy {
  getMember: jasmine.Spy;
  updateMember: jasmine.Spy;
}
interface ILocationSpy {
  back: jasmine.Spy;
}

describe('memberDetailComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* create spies on memberService methods */
    const membersServiceSpy = jasmine.createSpyObj('membersService', [
      'getMember',
      'updateMember',
    ]);
    /* stub ActivatedRoute with a configurable path parameter */
    const activatedRouteStub = new ActivatedRouteSnapshotStub(0);
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
        { provide: MembersService, useValue: membersServiceSpy },
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

  function createSpies(
    memberServiceSpy: IMembersServiceSpy,
    locationSpy: ILocationSpy,
  ) {
    const getMemberSpy = memberServiceSpy.getMember.and.callFake(
      (id: number) => {
        /* return no member to simulate memberService 404 */
        if (!id) {
          return asyncData('');
        }
        /* throw error to simulate unexpected error */
        if (id === -1) {
          return throwError(new Error('Fake getMember error'));
        }
        /* return a member as expected */
        return asyncData({ id, name: 'test' + id });
      },
    );
    const updateMemberSpy = memberServiceSpy.updateMember.and.callFake(
      (member: IMember) => {
        /* throw error to simulate unexpected error */
        if (member.id === 9) {
          return throwError(new Error('Fake updateMember error'));
        }
        /* return as expected */
        return asyncData('');
      },
    );

    const backSpy = locationSpy.back.and.stub();

    return { getMemberSpy, updateMemberSpy, backSpy };
  }

  /**
   * Create the MemberDetailComponent, initialize it, set test variables.
   */
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
      ActivatedRouteSnapshotStub
    >(ActivatedRoute as any);

    /* create the component instance */
    const component = fixture.componentInstance;
    /* do not run fixture.detectChanges (i.e. ngOnIt here) as included below */

    const { getMemberSpy, updateMemberSpy, backSpy } = createSpies(
      membersServiceSpy,
      locationSpy,
    );

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      getMemberSpy,
      updateMemberSpy,
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

    it('should have the default member before ngOnInit called', async () => {
      const { component } = await setup();
      expect(component.member).toEqual({ id: 0, name: '' });
    });

    it('should have the right member after ngOnInit called', async () => {
      const { component, fixture, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 1;
      activatedRouteStub.setId(routeId);
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* test */
      expect(component.member.name).toEqual('test' + routeId);
    });

    it('should call goBack', async () => {
      const { component, fixture, backSpy, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 1;
      activatedRouteStub.setId(routeId);
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* manually call goBack() */
      component.goBack();
      /* test */
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('should call save() and update the member', async () => {
      const {
        component,
        fixture,
        updateMemberSpy,
        backSpy,
        activatedRouteStub,
      } = await setup();
      /* set up route that the component will get */
      const routeId = 2;
      activatedRouteStub.setId(routeId);
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* manually call save() with the user name */
      component.save('test' + routeId);
      /* await async data return */
      await fixture.whenStable();
      expect(updateMemberSpy).toHaveBeenCalledTimes(1);
      expect(updateMemberSpy).toHaveBeenCalledWith({
        id: routeId,
        name: 'test' + routeId,
      });
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('page', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should show the right values on start up', async () => {
      const { fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 2;
      activatedRouteStub.setId(routeId);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.header.innerText).toBe('');
      expect(page.nameDisplay.innerText).toEqual('NAME:');
      expect(page.idDisplay.innerText).toEqual('ID: 0');
      /* get the mode attribute in the member input element */
      const mode = page.memberInput.attributes.getNamedItem('ng-reflect-mode');
      expect(mode!.value).toBe('edit', 'input box is set to edit mode');
      /* get the inputText attribute in the member input element */
      const text = page.memberInput.attributes.getNamedItem(
        'ng-reflect-input-text',
      );
      expect(text!.value).toBe('', "input box value is set to the '' ");
      /* data bind & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.nameDisplay.innerText).toEqual('NAME: ' + 'test' + routeId);
      expect(page.idDisplay.innerText).toEqual(`ID: ${routeId}`);
      /* get the inputText attribute in the member input element */
      expect(text!.value).toBe(
        'test' + routeId,
        'input box value is set to the supplied name',
      );
    });

    it('should respond to input event', async () => {
      const { component, fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 2;
      activatedRouteStub.setId(routeId);
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* stub on the save() method */
      const saveSpy = spyOn(component, 'save').and.stub();
      /* get the input element */
      const input = page.memberInput;
      /* dispatch an 'inputEnter' event to the member input element */
      const inputEvent = new Event('inputEnter');
      input.dispatchEvent(inputEvent);
      /* test that save() was called */
      expect(saveSpy).toHaveBeenCalledWith(inputEvent);
    });

    it('should click the go back button', async () => {
      const { fixture, page, backSpy, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 4;
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* click the go back button */
      click(page.goBackButton);
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('should translate input name to uppercase in header', async () => {
      const { component, fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 7;
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* test name field before changing component */
      expect(page.nameDisplay.innerText).toEqual('NAME: ' + 'test' + routeId);
      /* set the name input field */
      const name = 'testName';
      component.save(name);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.header.innerText).toEqual(name.toUpperCase());
    });
  });

  describe('errors', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should go back on path with no id', async () => {
      const {
        fixture,
        getMemberSpy,
        backSpy,
        activatedRouteStub,
      } = await setup();
      /* set up route with no id */
      const routeId = '';
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(getMemberSpy).toHaveBeenCalledTimes(1);
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('should go back on getMember error', async () => {
      const {
        fixture,
        getMemberSpy,
        backSpy,
        activatedRouteStub,
      } = await setup();
      /* set up route that will trigger error */
      const routeId = -1;
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(getMemberSpy).toHaveBeenCalledTimes(1);
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('should go back on updateMember error', async () => {
      const {
        fixture,
        component,
        updateMemberSpy,
        backSpy,
        activatedRouteStub,
      } = await setup();
      const routeId = 6;
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* set member id that will trigger an error */
      component.member = { id: 9, name: 'testError' };
      component.save('testError');
      expect(updateMemberSpy).toHaveBeenCalledTimes(1);
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });
});
