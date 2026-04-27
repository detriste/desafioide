import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginAlmoxarifePage } from './login-almoxarife.page';

describe('LoginAlmoxarifePage', () => {
  let component: LoginAlmoxarifePage;
  let fixture: ComponentFixture<LoginAlmoxarifePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginAlmoxarifePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
