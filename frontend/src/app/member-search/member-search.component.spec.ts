import { async, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MemberSearchComponent } from './member-search.component';
import { MembersService } from '../members.service';
import { members } from '../mock-members';
import { IMember } from '../membersApi/model/models';

describe('memberSearchComponent', () => {
  async function setup() {
    const memberService = jasmine.createSpyObj('memberService', ['getMembers']);
    const getMembersSpy = memberService.getMembers.and.returnValue(of(members));
    TestBed.configureTestingModule({
      declarations: [MemberSearchComponent],
      imports: [RouterTestingModule.withRoutes([]), HttpClientTestingModule],
      providers: [
        {
          provide: MembersService,
          useValue: memberService,
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MemberSearchComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return {
      component,
      fixture,
      getMembersSpy,
    };
  }

  it('should be created', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should display the title', async(async () => {
    const { component, fixture } = await setup();
    const result = fixture.debugElement.query((de) => {
      return de.nativeElement.id === 'title';
    });
    expect(result.nativeElement.innerText).toEqual(component.title);
  }));

  it('should show search results', fakeAsync(async () => {
    const { component, fixture, getMembersSpy } = await setup();
    component.search('x');
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(
      members.length,
    );
    expect(getMembersSpy.calls.count()).toBe(1);
  }));

  it('should show not search with no delay', fakeAsync(async () => {
    const { component, fixture, getMembersSpy } = await setup();
    component.search('x');
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(0);
    expect(getMembersSpy.calls.count()).toBe(0);
    tick(1000);
  }));

  it('should show not search results with no change', fakeAsync(async () => {
    const { component, fixture, getMembersSpy } = await setup();
    component.search('x');
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(
      members.length,
    );
    expect(getMembersSpy.calls.count()).toBe(1);

    /* second search */
    component.search('x');
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    /* no change in getMemberSpy call count */
    expect(getMembersSpy.calls.count()).toBe(1);
  }));

  it('should display 1st member', fakeAsync(async () => {
    const { component, fixture } = await setup();
    component.search('x');
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();

    /* get first listed member */
    const firstListed = fixture.nativeElement.querySelectorAll('a');
    /* first listed will be the display property of the first member */
    expect(firstListed[0].innerText).toEqual(
      members[0][component.propertyToDisplay],
    );
  }));

  it('should test trackBy function returns member.id', async () => {
    const { component } = await setup();
    const result = component.trackByFn(0, members[1]);
    expect(result).toEqual(members[1].id);
  });

  it('should test trackBy function returns null', async () => {
    const { component } = await setup();
    const result = component.trackByFn(0, (null as unknown) as IMember);
    expect(result).toEqual(null);
  });
});
