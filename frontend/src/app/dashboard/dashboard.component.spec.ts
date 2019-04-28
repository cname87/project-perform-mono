import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardComponent } from './dashboard.component';
import { MemberSearchComponent } from '../member-search/member-search.component';

import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { members } from '../mock-members';
import { MembersService } from '../members.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let memberService;
  let getMembersSpy;

  beforeEach(async(() => {
    memberService = jasmine.createSpyObj('memberService', ['getMembers']);
    getMembersSpy = memberService.getMembers.and.returnValue(of(members));
    TestBed.configureTestingModule({
      declarations: [DashboardComponent, MemberSearchComponent],
      imports: [RouterTestingModule.withRoutes([])],
      providers: [{ provide: MembersService, useValue: memberService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Top Members" as headline', () => {
    expect(fixture.nativeElement.querySelector('h3').textContent).toEqual(
      'Top Members',
    );
  });

  it('should call memberService', async(() => {
    expect(getMembersSpy.calls.any()).toBe(true);
  }));

  it('should display 4 links', async(() => {
    expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(4);
  }));
});
