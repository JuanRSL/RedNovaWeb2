import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'rn-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  error = signal('');
  isSubmitting = signal(false);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  constructor(private authService: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) {
      this.error.set('Por favor, complete todos los campos correctamente.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    this.authService.login(this.form.value as { email: string; password: string }).subscribe({
      next: () => {
        this.router.navigate(['/posts']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err?.error?.message || 'No se ha podido iniciar sesion.');
      }
    });
  }
}