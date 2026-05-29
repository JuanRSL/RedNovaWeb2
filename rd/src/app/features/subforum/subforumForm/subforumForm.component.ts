import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SubforumService } from '../../../services/subforum.service';
import { ForumService } from '../../../services/forum.service';
import { AuthService } from '../../../services/auth.service';
import { Forum } from '../../../models/forum.model';

@Component({
  selector: 'rn-subforum-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subforumForm.component.html',
  styleUrls: ['./subforumForm.component.css']
})
export class SubforumFormComponent implements OnInit {
  // Cambiamos a inject para mantener consistencia con las mejoras del proyecto
  private subforumService = inject(SubforumService);
  private forumService = inject(ForumService);
  private authService = inject(AuthService);
  private router = inject(Router);

  error = signal('');
  isSubmitting = signal(false);
  forums = signal<Forum[]>([]);

  form = new FormGroup({
    forumId: new FormControl('', Validators.required),
    name: new FormControl('', Validators.required),
    slug: new FormControl('', Validators.required),
    description: new FormControl('')
  });

  constructor() {}

  ngOnInit() {
    // Protección de ruta manual (adicional al guard)
    if (!this.authService.currentUser()) {
      this.error.set('Debes iniciar sesión para crear un subforo.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.forumService.getAllForums().subscribe({
      next: (forums) => this.forums.set(forums),
      error: () => this.error.set('No se pudieron cargar los foros.')
    });
  }

  submit() {
    if (this.form.invalid) {
      this.error.set('Complete los campos requeridos.');
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return;
    }

    // Construimos el payload siguiendo el estándar del backend (Post pattern)
    const payload = {
      name: this.form.value.name || '',
      // Normalizamos el slug para evitar errores 400 por formato
      slug: (this.form.value.slug || '').toLowerCase().trim().replace(/\s+/g, '-'),
      description: this.form.value.description || '',
      forum: this.form.value.forumId || '', // Cambiado de forumId a forum
      author: {
        id: currentUser._id || (currentUser as any).id,
        username: currentUser.username
      }
    };

    this.isSubmitting.set(true);
    this.subforumService.createSubforum(payload).subscribe({
      next: () => this.router.navigate(['/forums']),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo crear el subforo.');
        this.isSubmitting.set(false);
      }
    });
  }
}
