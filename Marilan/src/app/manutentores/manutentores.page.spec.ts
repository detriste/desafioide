import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManutentoresPage } from './manutentores.page';

describe('ManutentoresPage', () => {
  let component: ManutentoresPage;
  let fixture: ComponentFixture<ManutentoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManutentoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
