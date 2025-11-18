import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterPrincipal } from './footer-principal';

describe('FooterPrincipal', () => {
  let component: FooterPrincipal;
  let fixture: ComponentFixture<FooterPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterPrincipal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterPrincipal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
