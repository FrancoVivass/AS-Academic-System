import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EncabezadoPrincipal } from '../encabezado-principal/encabezado-principal';
import { FooterPrincipal } from '../footer-principal/footer-principal';

@Component({
  selector: 'app-acerca-de',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, EncabezadoPrincipal, FooterPrincipal],
  templateUrl: './acerca-de.html',
  styleUrl: './acerca-de.css'
})
export class AcercaDeComponent {
}






