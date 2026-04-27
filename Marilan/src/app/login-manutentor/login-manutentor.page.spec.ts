import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginManutentorPage } from './login-manutentor.page';

describe('LoginManutentorPage', () => {
  let component: LoginManutentorPage;
  let fixture: ComponentFixture<LoginManutentorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginManutentorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
