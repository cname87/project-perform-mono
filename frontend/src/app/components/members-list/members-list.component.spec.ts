import { Location, APP_BASE_HREF } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { MembersListComponent } from './members-list.component';
import { MembersService } from '../../shared/services/members.service';
import {
  findAllCssOrNot,
  findCssOrNot,
  asyncData,
  click,
} from '../../shared/test-helpers';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IMember, IMemberWithoutId } from '../../api/api-members.service';
import { members } from '../../shared/mocks/mock-members';
import { SpyLocation } from '@angular/common/testing';

interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
  addMember: jasmine.Spy;
  deleteMember: jasmine.Spy;
}

describe('membersListComponent', () => {
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

    const membersArray = JSON.parse(JSON.stringify(members));

    /* create the component instance */
    const component = fixture.componentInstance;

    const { getMembersSpy, addMemberSpy, deleteMemberSpy } = createSpies(
      membersServiceSpy,
      membersArray,
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
      membersArray,
      spyLocation,
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
      expect(component).toBeTruthy('component created');
    });

    it('should have the default member before ngOnInit called', async () => {
      const { component } = await setup();
      expect(component.members).toEqual([], 'initial members array is empty');
    });

    it('should have the members after ngOnInit called', async () => {
      const { component, fixture, getMembersSpy, membersArray } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* test */
      expect(getMembersSpy).toHaveBeenCalledTimes(1);
      expect(component.members.length).toEqual(
        membersArray.length,
        'members retrieved',
      );
    });

    it('should call getMembers()', async () => {
      const { component, fixture, getMembersSpy, membersArray } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* getMembersSpy called on ngOnInit */
      expect(getMembersSpy).toHaveBeenCalledTimes(1);
      /* increase members.length */
      membersArray.push({ id: 21, name: 'test21' });
      /* manually call getMembers() */
      component.getMembers();
      /* getMembersSpy called again after getMembers() */
      expect(getMembersSpy).toHaveBeenCalledTimes(2);
      /* await asyncData call */
      await fixture.whenStable();
      expect(component.members.length).toEqual(
        membersArray.length,
        'members retrieved',
      );
    });

    it('should call add()', async () => {
      const { component, fixture, addMemberSpy } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
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
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
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
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* call add() */
      const testName = '';
      component.add(testName);
      /* await async data return */
      await fixture.whenStable();
      expect(addMemberSpy).toHaveBeenCalledTimes(0);
    });

    it('should call delete()', async () => {
      const {
        component,
        fixture,
        deleteMemberSpy,
        membersArray,
      } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* call component function */
      const startMembersCount = membersArray.length;
      const testMember = membersArray[0];
      component.delete(testMember);
      expect(deleteMemberSpy).toHaveBeenCalledTimes(1);
      expect(deleteMemberSpy).toHaveBeenCalledWith(testMember.id);
      /* test a member was deleted */
      expect(component.members.length).toEqual(startMembersCount - 1);
    });

    it('should test trackBy function returns member.id', async () => {
      const { component, membersArray } = await setup();
      const result = component.trackByFn(0, membersArray[1]);
      expect(result).toEqual(membersArray[1].id);
    });

    it('should test trackBy function returns null', async () => {
      const { component } = await setup();
      const result = component.trackByFn(0, (null as unknown) as IMember);
      expect(result).toEqual(null);
    });
  });

  describe('page', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should show the right values on start up', async () => {
      const { fixture, page, membersArray } = await setup();
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      /* default constructor member shown */
      expect(page.linksArray!.length).toEqual(0);
      /* get the mode attribute in the member input element */
      const mode = page.memberInput.attributes.getNamedItem('ng-reflect-mode');
      expect(mode!.value).toBe('add', 'input box is set to edit mode');
      /* get the inputText attribute in the member input element */
      const text = page.memberInput.attributes.getNamedItem(
        'ng-reflect-input-text',
      );
      expect(text!.value).toBe('', "input box value is set to the '' ");
      /* data bind & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      /* 2 anchor links per member */
      expect(page.linksArray!.length).toEqual(membersArray.length * 2);
      expect(page.linksArray![5].nativeElement.innerText).toEqual(
        membersArray[2].name,
      );
      expect(page.memberIdArray![2].nativeElement.innerText).toEqual(
        membersArray[2].id.toString(),
      );
      expect(page.deleteBtnArray!.length).toEqual(membersArray.length);
    });

    it('should respond to input event', async () => {
      const { component, fixture, page } = await setup();
      /* page fields will be null before ngOnInit */
      /* await component ngOnInit and data binding */
      fixture.detectChanges();
      await fixture.whenStable();
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
        membersArray,
      } = await setup();
      /* set up route that the component will get */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      const startMembersCount = membersArray.length;
      /* get a member to delete */
      const n = 2;
      const button = page.deleteBtnArray![n];
      const id = +page.memberIdArray![n].nativeElement.innerText;
      /* click the delete button */
      click(button);
      /* await async data return  & data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
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
      const { fixture, page, membersArray, spyLocation } = await setup();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.linksArray!.length).toEqual(0);
      fixture.detectChanges();
      await fixture.whenStable();
      /* 2 anchors per member */
      expect(page.linksArray!.length).toEqual(membersArray.length * 2);
      expect(page.linksArray![5].nativeElement.innerText).toEqual(
        membersArray[2].name,
      );
      expect(page.memberIdArray![2].nativeElement.innerText).toEqual(
        membersArray[2].id.toString(),
      );
      expect(page.deleteBtnArray!.length).toEqual(membersArray.length);
      fixture.ngZone!.run(() => {
        click(page.linksArray![4]);
      });
      fixture.detectChanges();
      await fixture.whenStable();
      const id = membersArray[2].id;
      expect(spyLocation.path()).toEqual(
        `/detail/${id}`,
        'after clicking members link',
      );
    });
  });
});
