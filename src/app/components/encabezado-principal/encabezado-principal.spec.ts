import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncabezadoPrincipal } from './encabezado-principal';

describe('EncabezadoPrincipal', () => {
  let component: EncabezadoPrincipal;
  let fixture: ComponentFixture<EncabezadoPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncabezadoPrincipal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncabezadoPrincipal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
