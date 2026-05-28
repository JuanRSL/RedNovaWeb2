import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'rn-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  error = signal('');
  isSubmitting = signal(false);

  get currentUser() {
    return this.authService.currentUser;
  }

  form = new FormGroup({
    username: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    role: new FormControl('user')
  });

  constructor(private authService: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) {
      this.error.set('Por favor, complete todos los campos correctamente.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    const formValue = this.form.value as { username: string; email: string; password: string; role: string };
    const registerPayload: { username: string; email: string; password: string; roles?: string[] } = {
      username: formValue.username,
      email: formValue.email,
      password: formValue.password
    };

    if (this.currentUser()?.roles?.includes('admin')) {
      registerPayload.roles = [formValue.role || 'user'];
    }

    this.authService.register(registerPayload).subscribe({
      next: () => {
        this.router.navigate(['/posts']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err?.error?.message || 'No se ha podido registrar.');
      }
    });
  }
}