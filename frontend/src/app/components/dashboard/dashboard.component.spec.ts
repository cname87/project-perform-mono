import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';
import { MemberSearchComponent } from '../member-search/member-search.component';
/* members contains an array of 10 dummy members */
import { members } from '../../shared/mocks/mock-members';
import { MembersService } from '../../shared/services/members.service';
import { IMember } from '../../api/model/models';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let memberService: any;
  let getMembersSpy: jasmine.Spy;

  beforeEach(async(() => {
    memberService = jasmine.createSpyObj('memberService', ['getMembers']);
    getMembersSpy = memberService.getMembers.and.returnValue(of(members));
    TestBed.configureTestingModule({
      declarations: [DashboardComponent, MemberSearchComponent],
      imports: [
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule,
        HttpClientModule,
      ],
      providers: [
        {
          provide: MembersService,
          useValue: memberService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.debugElement.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title', () => {
    const result = fixture.debugElement.query((de) => {
      return de.nativeElement.id === 'title';
    });
    expect(result.nativeElement.innerText).toEqual(component.title);
  });

  it('should call memberService.getMembers', async(() => {
    expect(getMembersSpy.calls.count()).toBe(1);
  }));

  it('should display 4 links', async(() => {
    expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(4);
  }));

  it('should display 1st member', async(() => {
    const member = component.firstMemberOnDisplay;
    expect(
      fixture.nativeElement.getElementsByClassName('module member')[member - 1]
        .innerText,
    ).toEqual(members[member - 1].name);
  }));

  it('should display last member', async(() => {
    const member = component.lastMemberOnDisplay;
    expect(
      fixture.nativeElement.getElementsByClassName('module member')[member - 1]
        .innerText,
    ).toEqual(members[member - 1].name);
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
