import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ForumService } from '../../../services/forum.service';

@Component({
  selector: 'rn-forum-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forumForm.component.html',
  styleUrls: ['./forumForm.component.css']
})
export class ForumFormComponent implements OnInit {
  error = signal('');
  isSubmitting = signal(false);

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    slug: new FormControl('', Validators.required),
    description: new FormControl(''),
    isPrivate: new FormControl(false)
  });

  constructor(private forumService: ForumService, private router: Router) {}

  ngOnInit() {}

  submit() {
    if (this.form.invalid) {
      this.error.set('Complete los campos requeridos.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    const payload = {
      name: this.form.value.name || '',
      slug: this.form.value.slug || '',
      description: this.form.value.description || '',
      isPrivate: this.form.value.isPrivate || false
    };

    this.forumService.createForum(payload).subscribe({
      next: () => this.router.navigate(['/forums']),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo crear el foro.');
        this.isSubmitting.set(false);
      }
    });
  }
}
