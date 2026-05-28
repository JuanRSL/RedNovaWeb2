import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SubforumService } from '../../../services/subforum.service';
import { ForumService } from '../../../services/forum.service';
import { Forum } from '../../../models/forum.model';

@Component({
  selector: 'rn-subforum-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subforumForm.component.html',
  styleUrls: ['./subforumForm.component.css']
})
export class SubforumFormComponent implements OnInit {
  error = signal('');
  isSubmitting = signal(false);
  forums = signal<Forum[]>([]);

  form = new FormGroup({
    forumId: new FormControl('', Validators.required),
    name: new FormControl('', Validators.required),
    slug: new FormControl('', Validators.required),
    description: new FormControl('')
  });

  constructor(
    private subforumService: SubforumService,
    private forumService: ForumService,
    private router: Router
  ) {}

  ngOnInit() {
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

    const payload = {
      forumId: this.form.value.forumId || '',
      name: this.form.value.name || '',
      slug: this.form.value.slug || '',
      description: this.form.value.description || ''
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
