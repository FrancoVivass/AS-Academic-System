import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MatSnackBarModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Gestión Académica';
}
