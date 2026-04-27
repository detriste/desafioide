import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlmoxarifePage } from './almoxarife.page';

describe('AlmoxarifePage', () => {
  let component: AlmoxarifePage;
  let fixture: ComponentFixture<AlmoxarifePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlmoxarifePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
