import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { MessagesComponent } from './messages/messages.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent, MessagesComponent],
      imports: [RouterTestingModule.withRoutes([])],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Top Members" as headline', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toEqual(
      component.title,
    );
  });

  it('should display 2 links', async(() => {
    expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(2);
  }));
});
