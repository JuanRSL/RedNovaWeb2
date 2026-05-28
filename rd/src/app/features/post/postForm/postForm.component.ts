import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, retry, finalize } from 'rxjs';
import { PostService } from '../../../services/post.service';
import { SubforumService } from '../../../services/subforum.service';
import { Subforum } from '../../../models/subforum.model';

@Component({
  selector: 'rn-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './postForm.component.html',
  styleUrls: ['./postForm.component.css']
})
export class PostFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  error = signal('');
  isSubmitting = signal(false);
  isLoadingSubforums = signal(false);
  subforums = signal<Subforum[]>([]);
  loadError = signal(false);

  form = new FormGroup({
    title: new FormControl('', Validators.required),
    content: new FormControl('', Validators.required),
    subforum: new FormControl('', Validators.required)
  });

  constructor(
    private postService: PostService,
    private subforumService: SubforumService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSubforums();
  }

  loadSubforums() {
    this.isLoadingSubforums.set(true);
    this.loadError.set(false);
    this.error.set('');
    
    this.subforumService.getSubforums()
      .pipe(
        retry(2),
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingSubforums.set(false))
      )
      .subscribe({
        next: (subforums) => {
          this.subforums.set(subforums);
          if (subforums.length === 0) {
            this.error.set('No hay subforos disponibles en este momento.');
          }
        },
        error: (err) => {
          this.loadError.set(true);
          this.error.set(err?.error?.message || 'No se ha podido cargar los subforos. Por favor, intente nuevamente.');
        }
      });
  }

  retryLoadSubforums() {
    this.loadSubforums();
  }

  submit() {
    if (this.form.invalid) {
      this.error.set('Por favor, complete todos los campos correctamente.');
      this.markFormGroupTouched(this.form);
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    const formValue = {
      title: this.form.value.title || '',
      content: this.form.value.content || '',
      subforum: this.form.value.subforum || ''
    };

    this.postService.createPost(formValue)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/posts']);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se ha podido crear la publicación.');
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
