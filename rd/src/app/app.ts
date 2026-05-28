import { Component, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NgIf],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  logout() {
    this.authService.logout();
  }
}
