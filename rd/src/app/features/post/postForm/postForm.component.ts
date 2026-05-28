// postForm.component.ts
import { Component, OnInit, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, retry, finalize } from 'rxjs';
import { PostService } from '../../../services/post.service';
import { SubforumService } from '../../../services/subforum.service';
import { AuthService } from '../../../services/auth.service';
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
  
  // Inyección de dependencias
  private postService = inject(PostService);
  private subforumService = inject(SubforumService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Signals
  error = signal('');
  isSubmitting = signal(false);
  isLoadingSubforums = signal(false);
  subforums = signal<Subforum[]>([]);
  loadError = signal(false);

  // Formulario
  form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]),
    content: new FormControl('', [Validators.required, Validators.minLength(10)]),
    subforum: new FormControl('', Validators.required)
  });

  ngOnInit() {
    // Verificar si el usuario está autenticado
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('Debes iniciar sesión para crear una publicación');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.loadSubforums();
  }

  loadSubforums() {
    this.isLoadingSubforums.set(true);
    this.loadError.set(false);
    this.error.set('');
    
    // Cargar todos los subforos
    this.subforumService.getSubforums()
      .pipe(
        retry(2),
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingSubforums.set(false))
      )
      .subscribe({
        next: (subforums) => {
          console.log('Subforos cargados:', subforums);
          this.subforums.set(subforums);
          if (subforums.length === 0) {
            this.error.set('No hay subforos disponibles en este momento.');
          }
        },
        error: (err) => {
          console.error('Error loading subforums:', err);
          this.loadError.set(true);
          this.error.set(err?.error?.message || 'No se ha podido cargar los subforos. Por favor, intente nuevamente.');
        }
      });
  }

  retryLoadSubforums() {
    this.loadSubforums();
  }

  submit() {
    // Validar formulario
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      
      if (this.form.get('title')?.errors?.['required']) {
        this.error.set('El título es requerido');
      } else if (this.form.get('title')?.errors?.['minlength']) {
        this.error.set('El título debe tener al menos 3 caracteres');
      } else if (this.form.get('title')?.errors?.['maxlength']) {
        this.error.set('El título no puede exceder los 200 caracteres');
      } else if (this.form.get('content')?.errors?.['required']) {
        this.error.set('El contenido es requerido');
      } else if (this.form.get('content')?.errors?.['minlength']) {
        this.error.set('El contenido debe tener al menos 10 caracteres');
      } else if (this.form.get('subforum')?.errors?.['required']) {
        this.error.set('Debes seleccionar un subforo');
      } else {
        this.error.set('Por favor, complete todos los campos correctamente.');
      }
      return;
    }

    // Verificar autenticación nuevamente
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('Debes iniciar sesión para crear una publicación');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    // Obtener el forumId del subforum seleccionado
    const selectedSubforumId = this.form.value.subforum || '';
    const selectedSubforum = this.subforums().find((sf: any) => sf._id === selectedSubforumId || sf.id === selectedSubforumId);
    
    if (!selectedSubforum) {
      this.error.set('Error: Subforo no encontrado');
      this.isSubmitting.set(false);
      return;
    }
    
    // El forumId puede venir como string o como objeto dependiendo del backend
    const forumData = selectedSubforum.forum as any;
    const forumId = typeof forumData === 'object' && forumData !== null
      ? (forumData.id || forumData._id)
      : forumData;
    
    if (!forumId) {
      this.error.set('Error: El subforo seleccionado no tiene un foro asociado');
      this.isSubmitting.set(false);
      return;
    }

    // author debe ser un objeto con id y username
    const postData: any = {
      title: this.form.value.title?.trim() || '',
      content: this.form.value.content?.trim() || '',
      author: {
        id: currentUser._id,
        username: currentUser.username
      },
      forum: forumId,
      subforum: selectedSubforumId
    };

    console.log('Enviando publicación:', {
      ...postData,
      subforumName: selectedSubforum.name,
      forumId: forumId
    });

    this.postService.createPost(postData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          console.log('Publicación creada exitosamente:', response);
          // Redirigir al post recién creado o al listado
          if (response && response._id) {
            this.router.navigate(['/posts', response._id]);
          } else {
            this.router.navigate(['/posts']);
          }
        },
        error: (err) => {
          console.error('Error al crear publicación:', err);
          
          // Mostrar mensaje de error específico del backend
          let errorMessage = 'No se ha podido crear la publicación.';
          
          if (err?.error?.message) {
            errorMessage = err.error.message;
          } else if (err?.error?.error) {
            errorMessage = err.error.error;
          } else if (err?.message) {
            errorMessage = err.message;
          }
          
          this.error.set(errorMessage);
          
          // Si el error es de autenticación, redirigir al login
          if (err?.status === 401) {
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          }
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

  // Getters para fácil acceso en el template
  get title() { return this.form.get('title'); }
  get content() { return this.form.get('content'); }
  get subforumControl() { return this.form.get('subforum'); }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}