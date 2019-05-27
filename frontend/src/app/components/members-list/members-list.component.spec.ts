import { Location, APP_BASE_HREF } from '@angular/common';
import { By } from '@angular/platform-browser';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { MembersListComponent } from './members-list.component';
import { MembersService } from '../../shared/services/members.service';
import { asyncData, click } from '../../shared/test-helpers';
import { throwError } from 'rxjs/internal/observable/throwError';
import {
  IMember,
  IMemberWithoutId,
} from '../../api-members/api-members.service';
import { members } from '../../shared/mocks/mock-members';
import { DebugElement } from '@angular/core';
import { SpyLocation } from '@angular/common/testing';

interface IMembersServiceSpy {
  getMembers: jasmine.Spy;
  addMember: jasmine.Spy;
  deleteMember: jasmine.Spy;
}

describe('membersComponent', () => {
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
    get header() {
      return this.findId<HTMLHeadingElement>('header');
    }
    get nameInput() {
      return this.findId<HTMLInputElement>('nameInput');
    }
    get addButton() {
      return this.findId<HTMLButtonElement>('addBtn');
    }
    get linksArray() {
      return this.findElements('a');
    }
    get memberIdArray() {
      return this.findElements('span.badge');
    }
    get deleteBtnArray() {
      return this.findElements('button.delete');
    }

    constructor(readonly fixture: ComponentFixture<MembersListComponent>) {}

    private findId<T>(id: string): T {
      const element = this.fixture.debugElement.query(By.css('#' + id));
      return element.nativeElement;
    }
    private findElements(el: string): DebugElement[] {
      const elements = this.fixture.debugElement.queryAll(By.css(el));
      return elements;
    }
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

    /* create the component instance */
    const component = fixture.componentInstance;

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    const membersArray = JSON.parse(JSON.stringify(members));

    const { getMembersSpy, addMemberSpy, deleteMemberSpy } = createSpies(
      membersServiceSpy,
      membersArray,
    );

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
      expect(component).toBeTruthy();
    });

    it('should have the default member before ngOnInit called', async () => {
      const { component } = await setup();
      expect(component.members).toEqual([]);
    });

    it('should have the members after ngOnInit called', async () => {
      const { component, fixture, getMembersSpy, membersArray } = await setup();
      /* initiate ngOnInit */
      fixture.detectChanges();
      /* await asyncData call */
      await fixture.whenStable();
      /* test */
      expect(getMembersSpy).toHaveBeenCalledTimes(1);
      expect(component.members.length).toEqual(membersArray.length);
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
      expect(component.members.length).toEqual(membersArray.length);
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
      expect(page.header.textContent).toEqual('My Members');
      expect(page.nameInput.value).toEqual('');
      expect(page.linksArray.length).toEqual(0);
      /* data bind & display the async fetched data */
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.header.textContent).toEqual('My Members');
      expect(page.nameInput.value).toEqual('');
      expect(page.linksArray.length).toEqual(membersArray.length);
      expect(page.linksArray[2].nativeElement.textContent).toEqual(
        membersArray[2].id.toString() + ' ' + membersArray[2].name + ' ',
      );
      expect(page.memberIdArray[2].nativeElement.textContent).toEqual(
        membersArray[2].id.toString(),
      );
      expect(page.deleteBtnArray.length).toEqual(membersArray.length);
    });

    it('should click the add button', async () => {
      const { fixture, page, addMemberSpy, membersArray } = await setup();
      /* set up route that the component will get */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      const startMembersCount = membersArray.length;
      /* enter a name */
      const testName = 'testInput';
      page.nameInput.value = testName;
      /* click the add button */
      click(page.addButton);
      /* await async data return  & data binding */
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      /* input field was cleared */
      expect(page.nameInput.value).toEqual('');
      expect(addMemberSpy).toHaveBeenCalledTimes(1);
      expect(addMemberSpy).toHaveBeenCalledWith({
        name: testName,
      });
      expect(membersArray[membersArray.length - 1].name).toEqual(testName);
      expect(page.linksArray.length).toEqual(startMembersCount + 1);
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
      const button = page.deleteBtnArray[n];
      const id = +page.memberIdArray[n].nativeElement.textContent;
      /* click the add button */
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
      expect(page.header.textContent).toEqual('My Members');
      expect(page.nameInput.value).toEqual('');
      expect(page.linksArray.length).toEqual(0);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(page.header.textContent).toEqual('My Members');
      expect(page.nameInput.value).toEqual('');
      expect(page.linksArray.length).toEqual(membersArray.length);
      expect(page.linksArray[2].nativeElement.textContent).toEqual(
        membersArray[2].id.toString() + ' ' + membersArray[2].name + ' ',
      );
      expect(page.memberIdArray[2].nativeElement.textContent).toEqual(
        membersArray[2].id.toString(),
      );
      expect(page.deleteBtnArray.length).toEqual(membersArray.length);
      fixture.ngZone!.run(() => {
        click(page.linksArray[2]);
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
