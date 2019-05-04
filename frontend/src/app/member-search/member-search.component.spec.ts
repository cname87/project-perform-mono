import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MemberSearchComponent } from './member-search.component';
import { MembersService } from '../members.service';
import { IMember } from '../membersApi/model/models';

describe('memberSearchComponent', () => {
  let component: MemberSearchComponent;
  let fixture: ComponentFixture<MemberSearchComponent>;
  let memberService: any;
  let getMembersSpy: jasmine.Spy;

  const members = [
    { id: 1, name: 'name1'},
    { id: 1, name: 'name2'},
  ];

  beforeEach(async(() => {
    memberService = jasmine.createSpyObj('memberService', ['getMembers']);
    getMembersSpy = memberService.getMembers.and.returnValue(of(members));
    TestBed.configureTestingModule({
      declarations: [MemberSearchComponent],
      imports: [
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule],
      providers: [
        {
          provide: MembersService,
          useValue: memberService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title', async(() => {
    const result = fixture.debugElement.query((de) => {
      return de.nativeElement.id === 'title';
    });
    expect(result.nativeElement.innerText).toEqual(component.title);
  }));

  it('should show search results', fakeAsync(() => {
    component.search('x');
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement
      .querySelectorAll('a').length)
      .toEqual(members.length);
    expect(getMembersSpy.calls.count()).toBe(1);
  }));

  it('should show not search with no delay', fakeAsync(() => {
    component.search('x');
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    expect(fixture.nativeElement
      .querySelectorAll('a').length)
      .toEqual(0);
    expect(getMembersSpy.calls.count()).toBe(0);
    tick(1000);
  }));

  it('should show not search results with no change', fakeAsync(() => {
    component.search('x');
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement
      .querySelectorAll('a').length)
      .toEqual(members.length);
    expect(getMembersSpy.calls.count()).toBe(1);

    /* second search */
    component.search('x');
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    /* no change in getMemberSpy call count */
    expect(getMembersSpy.calls.count()).toBe(1);

  }));

  it('should test trackBy function returns member.id', () => {
    const result = component.trackByFn(0, members[1]);
    expect(result).toEqual(members[1].id);
  });

  it('should test trackBy function returns null', () => {
    const result = component.trackByFn(0, (null as unknown) as IMember);
    expect(result).toEqual(null);
  });
});
