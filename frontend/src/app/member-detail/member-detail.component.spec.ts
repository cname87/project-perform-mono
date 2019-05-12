import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF, Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

import { AppModule } from '../app.module';
import { MemberDetailComponent } from './member-detail.component';
import { MembersService } from '../members.service';
import {
  asyncData,
  ActivatedRoute,
  ActivatedRouteSnapshotStub,
  click,
} from '../tests';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IMember } from '../membersApi/membersApi';

interface IMembersServiceSpy {
  getMember: jasmine.Spy;
  updateMember: jasmine.Spy;
}
interface ILocationSpy {
  back: jasmine.Spy;
}

describe('memberDetailComponent', () => {
  /* setup function run by each sub test suite*/
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
      return this.findId<HTMLHeadingElement>('memberName');
    }
    get idDisplay() {
      return this.findId<HTMLSpanElement>('memberId');
    }
    get nameInput() {
      return this.findId<HTMLInputElement>('nameInput');
    }
    get goBackButton() {
      return this.findId<HTMLButtonElement>('goBackBtn');
    }
    get saveBtn() {
      return this.findId<HTMLButtonElement>('saveBtn');
    }

    constructor(readonly fixture: ComponentFixture<MemberDetailComponent>) {
      // const component = fixture.componentInstance;
    }

    private findId<T>(id: string): T {
      const element = this.fixture.debugElement.query(By.css('#' + id));
      return element.nativeElement;
    }
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
    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    const { getMemberSpy, updateMemberSpy, backSpy } = createSpies(
      membersServiceSpy,
      locationSpy,
    );

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

    it('should call save()', async () => {
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
      /* manually call save() */
      component.save();
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
      expect(page.header.textContent).toEqual(' Details');
      expect(page.idDisplay.textContent).toEqual('0');
      expect(page.nameInput.value).toEqual('');
      /* data bind & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.header.textContent).toEqual(
        'Test'.toUpperCase() + routeId + ' Details',
      );
      expect(page.idDisplay.textContent).toEqual(`${routeId}`);
      expect(page.nameInput.value).toEqual('test' + routeId);
    });
    it('should click the save button', async () => {
      const {
        fixture,
        page,
        updateMemberSpy,
        backSpy,
        activatedRouteStub,
      } = await setup();
      /* set up route that the component will get */
      const routeId = 3;
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* click the save button */
      click(page.saveBtn);
      /* await async data return */
      await fixture.whenStable();
      expect(updateMemberSpy).toHaveBeenCalledTimes(1);
      expect(updateMemberSpy).toHaveBeenCalledWith({
        id: routeId,
        name: 'test' + routeId,
      });
      expect(backSpy).toHaveBeenCalledTimes(1);
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
    it('should have name field be updated by member.name', async () => {
      const { fixture, component, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 5;
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* test name field before changing component */
      expect(page.nameInput.value).toEqual('test' + routeId);
      /* set the component member name */
      const name = 'testName';
      component.member.name = name;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.nameInput.value).toEqual(name);
    });
    it('should have name field update member.name', async () => {
      const { fixture, component, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 6;
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* test component member name before changing name field */
      expect(component.member.name).toEqual('test' + routeId);
      /* test name field before changing it */
      expect(page.nameInput.value).toEqual('test' + routeId);
      /* set the new name input field value */
      const name = 'testName';
      page.nameInput.value = name;
      page.nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.member.name).toEqual(name);
    });
    it('should translate input name to uppercase in header', async () => {
      const { fixture, page, activatedRouteStub } = await setup();
      /* set up route that the component will get */
      const routeId = 7;
      activatedRouteStub.setId(routeId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* test name field before changing component */
      expect(page.header.textContent).toEqual(
        'test'.toUpperCase() + routeId + ' Details',
      );
      /* set the name input field */
      const name = 'testName';
      page.nameInput.value = name;
      page.nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.header.textContent).toEqual(name.toUpperCase() + ' Details');
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
      /* set up route that no id */
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
      component.save();
      expect(updateMemberSpy).toHaveBeenCalledTimes(1);
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });
});
