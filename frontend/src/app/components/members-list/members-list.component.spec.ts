import { Location, APP_BASE_HREF } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SpyLocation } from '@angular/common/testing';
import { throwError } from 'rxjs/internal/observable/throwError';

import { AppModule } from '../../app.module';
import { MembersListComponent } from './members-list.component';
import { MembersService } from '../../shared/services/members.service';
import {
  findAllCssOrNot,
  findCssOrNot,
  asyncData,
  click,
} from '../../shared/test-helpers';
import { IMember, IMemberWithoutId } from '../../api/api-members.service';
import { members } from '../../shared/mocks/mock-members';

interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
  addMember: jasmine.Spy;
  deleteMember: jasmine.Spy;
}

describe('MembersListComponent', () => {
  /* setup function run by each sub test suite*/
  async function mainSetup() {
    /* create spies on memberService methods */
    const membersServiceSpy = jasmine.createSpyObj('membersService', [
      'getMembers',
      'addMember',
      'deleteMember',
    ]);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: MembersService, useValue: membersServiceSpy },
      ],
    }).compileComponents();
  }

  /**
   * Gets key DOM elements.
   */
  class Page {
    get linksArray() {
      return findAllCssOrNot(this.fixture, 'a');
    }
    get memberIdArray() {
      return findAllCssOrNot(this.fixture, '#memberId');
    }
    get deleteBtnArray() {
      return findAllCssOrNot(this.fixture, '#deleteBtn');
    }
    get memberInput() {
      return findCssOrNot<HTMLElement>(this.fixture, 'app-member-input');
    }

    constructor(readonly fixture: ComponentFixture<MembersListComponent>) {}
  }

  function createSpies(
    memberServiceSpy: IMembersServiceSpy,
    membersArray: IMember[],
  ) {
    const getMembersSpy = memberServiceSpy.getMembers.and.callFake(() => {
      /* note: replace members to return null or an error */
      /* return members as expected */
      return asyncData(membersArray);
    });
    const addMemberSpy = memberServiceSpy.addMember.and.callFake(
      (member: IMemberWithoutId) => {
        /* throw error to simulate unexpected error */
        if (member.name === 'error') {
          return throwError(new Error('Fake addMember error'));
        }
        /* return added member as expected */
        const newMember = { id: 21, name: member.name };
        return asyncData(newMember);
      },
    );
    const deleteMemberSpy = memberServiceSpy.deleteMember.and.callFake(
      (id: number) => {
        /* throw error to simulate unexpected error */
        if (id === 9) {
          return throwError(new Error('Fake deleteMember error'));
        }
        /* return nothing as expected */
        return asyncData(null);
      },
    );

    return {
      getMembersSpy,
      addMemberSpy,
      deleteMemberSpy,
    };
  }

  function createExpected() {
    return {
      /* member used for tests */
      memberIndex: 2,
      /* anchor corresponding to memberIndex i.e. member[2] is the 3rd member and there are two links per member => anchor[5] */
      anchorIndex: 5,
      /* create members array from imported mock members array */
      membersArray: JSON.parse(JSON.stringify(members)),
    };
  }

  /**
   * Create the component, initialize it & set test variables.
   */
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(MembersListComponent);

    /* get the injected instances */
    const injector = fixture.debugElement.injector;
    const spyLocation = injector.get<SpyLocation>(Location as any);
    const membersServiceSpy = injector.get<IMembersServiceSpy>(
      MembersService as any,
    );

    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    const { getMembersSpy, addMemberSpy, deleteMemberSpy } = createSpies(
      membersServiceSpy,
      expected.membersArray,
    );

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      page,
      getMembersSpy,
      addMemberSpy,
      deleteMemberSpy,
      spyLocation,
      expected,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run */
  async function preSetup() {
    await mainSetup();
    const methods = await createComponent();
    return methods;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup() {
    const methods = await preSetup();
    /* initiate ngOnInit and view changes etc */
    methods.fixture.detectChanges();
    await methods.fixture.whenStable();
    methods.fixture.detectChanges();
    await methods.fixture.whenStable();
    return methods;
  }

  describe('before ngOnInit', async () => {
    it('should have the default member before ngOnInit called', async () => {
      const { component } = await preSetup();
      expect(component.members).toEqual([], 'initial members array is empty');
    });
  });

  describe('after ngOnInit', async () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });

    it('should have the members after ngOnInit called', async () => {
      const { component, fixture, getMembersSpy, expected } = await setup();
      /* initiate ngOnInit and view changes etc */
      await fixture.detectChanges();
      await fixture.detectChanges();
      /* test */
      expect(getMembersSpy).toHaveBeenCalledTimes(1);
      expect(component.members.length).toEqual(
        expected.membersArray.length,
        'members retrieved',
      );
    });

    it('should call getMembers()', async () => {
      const { component, fixture, getMembersSpy, expected } = await setup();
      /* getMembersSpy called on ngOnInit */
      expect(getMembersSpy).toHaveBeenCalledTimes(1);
      /* increase members.length */
      expected.membersArray.push({ id: 21, name: 'test21' });
      /* manually call getMembers() */
      component.getMembers();
      /* getMembersSpy called again after getMembers() */
      expect(getMembersSpy).toHaveBeenCalledTimes(2);
      /* await asyncData call */
      await fixture.whenStable();
      expect(component.members.length).toEqual(
        expected.membersArray.length,
        'members retrieved',
      );
    });

    it('should call add()', async () => {
      const { component, fixture, addMemberSpy } = await setup();
      /* call add() */
      const testName = 'testName';
      component.add(testName);
      /* await async data return */
      await fixture.whenStable();
      expect(addMemberSpy).toHaveBeenCalledTimes(1);
      expect(addMemberSpy).toHaveBeenCalledWith({
        name: testName,
      });
    });

    it('should trim name before calling addMember', async () => {
      const { component, fixture, addMemberSpy } = await setup();
      /* call add() */
      const testName = '  testName  ';
      component.add(testName);
      /* await async data return */
      await fixture.whenStable();
      expect(addMemberSpy).toHaveBeenCalledTimes(1);
      expect(addMemberSpy).toHaveBeenCalledWith({
        name: testName.trim(),
      });
    });

    it('should not call addMember if no name', async () => {
      const { component, fixture, addMemberSpy } = await setup();
      /* call add() */
      const testName = '';
      component.add(testName);
      /* await async data return */
      await fixture.whenStable();
      expect(addMemberSpy).toHaveBeenCalledTimes(0);
    });

    it('should call delete()', async () => {
      const { component, deleteMemberSpy, expected } = await setup();
      /* call component function */
      const startMembersCount = expected.membersArray.length;
      const testMember = expected.membersArray[0];
      component.delete(testMember);
      expect(deleteMemberSpy).toHaveBeenCalledTimes(1);
      expect(deleteMemberSpy).toHaveBeenCalledWith(testMember.id);
      /* test a member was deleted */
      expect(component.members.length).toEqual(startMembersCount - 1);
    });

    it('should test trackBy function returns member.id', async () => {
      const { component, expected } = await setup();
      const result = component.trackByFn(0, expected.membersArray[1]);
      expect(result).toEqual(expected.membersArray[1].id);
    });

    it('should test trackBy function returns null', async () => {
      const { component } = await setup();
      const result = component.trackByFn(0, (null as unknown) as IMember);
      expect(result).toEqual(null);
    });
  });

  describe('page setup', async () => {
    it('should show the right values on start up', async () => {
      const { fixture, page, expected } = await preSetup();
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit only */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.linksArray!.length).toEqual(0);
      /* get the mode attribute in the member input element */
      const mode = page.memberInput.attributes.getNamedItem('ng-reflect-mode');
      expect(mode!.value).toBe('add', 'input box is set to add mode');
      /* get the inputText attribute in the member input element */
      const text = page.memberInput.attributes.getNamedItem(
        'ng-reflect-input-text',
      );
      expect(text!.value).toBe('', "input box value is set to the '' ");
      /* data bind & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      /* test a member link */
      expect(page.linksArray!.length).toEqual(expected.membersArray.length * 2);
      expect(
        page.linksArray![expected.anchorIndex].nativeElement.innerText,
      ).toEqual(expected.membersArray[expected.memberIndex].name);
      expect(
        page.memberIdArray![expected.memberIndex].nativeElement.innerText,
      ).toEqual(expected.membersArray[expected.memberIndex].id.toString());
      expect(page.deleteBtnArray!.length).toEqual(expected.membersArray.length);
    });
  });

  describe('page', async () => {
    it('should respond to input event', async () => {
      const { component, page } = await setup();
      /* stub on the add() method */
      const addSpy = spyOn(component, 'add').and.stub();
      /* get the input element */
      const input = page.memberInput;
      /* dispatch an 'inputEnter' event to the member input element */
      const inputEvent = new Event('inputEnter');
      input.dispatchEvent(inputEvent);
      /* test that add() was called */
      expect(addSpy).toHaveBeenCalledWith(inputEvent);
    });

    it('should click the delete button', async () => {
      const {
        fixture,
        component,
        page,
        deleteMemberSpy,
        expected,
      } = await setup();
      const startMembersCount = expected.membersArray.length;
      /* get a member to delete */
      const n = 2;
      const button = page.deleteBtnArray![n];
      const id = +page.memberIdArray![n].nativeElement.innerText;
      /* click the delete button */
      click(button);
      /* initiate ngOnInit and view changes etc */
      await fixture.detectChanges();
      await fixture.detectChanges();
      /* input field was cleared */
      expect(deleteMemberSpy).toHaveBeenCalledTimes(1);
      expect(deleteMemberSpy).toHaveBeenCalledWith(id);
      /* test a member was deleted */
      const shouldBeEmpty = component.members.filter(
        (m: IMember) => m.id === id,
      );
      expect(shouldBeEmpty).toEqual([]);
      expect(component.members.length).toEqual(startMembersCount - 1);
    });

    it('should navigate to "/detail" on click', async () => {
      const { fixture, page, expected, spyLocation } = await setup();
      /* test a member link */
      expect(page.linksArray!.length).toEqual(expected.membersArray.length * 2);
      expect(
        page.linksArray![expected.anchorIndex].nativeElement.innerText,
      ).toEqual(expected.membersArray[expected.memberIndex].name);
      expect(
        page.memberIdArray![expected.memberIndex].nativeElement.innerText,
      ).toEqual(expected.membersArray[expected.memberIndex].id.toString());
      expect(page.deleteBtnArray!.length).toEqual(expected.membersArray.length);
      fixture.ngZone!.run(() => {
        click(page.linksArray![4]);
      });
      /* initiate ngOnInit and view changes etc */
      await fixture.detectChanges();
      await fixture.detectChanges();
      const id = expected.membersArray[2].id;
      expect(spyLocation.path()).toEqual(
        `/detail/${id}`,
        'after clicking members link',
      );
    });
  });
});
