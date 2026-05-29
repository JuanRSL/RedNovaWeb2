// postForm.component.ts
import { Component, OnInit, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, retry, finalize, lastValueFrom } from 'rxjs';
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
  isReloadingSubforums = signal(false);

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
            this.error.set('No hay subforos disponibles en este momento. Por favor, intenta mas tarde.');
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

  /**
   * Recarga los subforos de manera silenciosa para verificar si el subforo seleccionado sigue existiendo.
   * Retorna true si se recargaron exitosamente, false en caso contrario.
   */
  private async reloadSubforumsSilently(): Promise<boolean> {
    this.isReloadingSubforums.set(true);
    
    try {
      const subforums = await lastValueFrom(
        this.subforumService.getSubforums().pipe(
          retry(1),
          takeUntil(this.destroy$)
        )
      );
      
      this.subforums.set(subforums);
      console.log('Subforos recargados silenciosamente:', subforums);
      
      // Si despues de recargar no hay subforos, mostrar mensaje
      if (subforums.length === 0) {
        this.error.set('No hay subforos disponibles en este momento.');
      }
      
      return true;
    } catch (err) {
      console.error('Error al recargar subforos silenciosamente:', err);
      return false;
    } finally {
      this.isReloadingSubforums.set(false);
    }
  }

  /**
   * Busca un subforo por su ID en la lista actual de subforos.
   * Soporta tanto _id como id.
   */
  private findSubforumById(subforumId: any): Subforum | undefined {
    if (!subforumId) return undefined;
    
    // Si el valor ya es un objeto (posible si se usa [ngValue]), intentamos extraer el ID
    const idToFind = typeof subforumId === 'object' 
      ? (subforumId._id || subforumId.id) 
      : subforumId;

    if (!idToFind) return undefined;

    return this.subforums().find(
      (sf: any) => String(sf._id) === String(idToFind) || String(sf.id) === String(idToFind)
    );
  }

  /**
   * Obtiene el ID del foro asociado a un subforo.
   * Maneja tanto casos donde forum es un string como un objeto.
   */
  private getForumId(subforum: Subforum): string | null {
    if (!subforum) return null;
    
    const forumData = (subforum as any).forum;
    
    if (!forumData) return null;
    
    // Si forum es un string, lo retornamos directamente
    if (typeof forumData === 'string') return forumData;
    
    // Si forum es un objeto, obtenemos su id o _id
    if (typeof forumData === 'object' && forumData !== null) {
      return forumData.id || forumData._id || null;
    }
    
    return null;
  }

  async submit() {
    // Validar formulario
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      
      if (this.form.get('title')?.errors?.['required']) {
        this.error.set('El titulo es requerido');
      } else if (this.form.get('title')?.errors?.['minlength']) {
        this.error.set('El titulo debe tener al menos 3 caracteres');
      } else if (this.form.get('title')?.errors?.['maxlength']) {
        this.error.set('El titulo no puede exceder los 200 caracteres');
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
      this.error.set('Debes iniciar sesion para crear una publicacion');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    // Obtener el subforumId del formulario
    const subforumValue = this.form.value.subforum;
    let selectedSubforum = this.findSubforumById(subforumValue);
    
    // Si no se encuentra el subforo, intentar recargar la lista y reintentar
    if (!selectedSubforum) {
      console.warn('Subforo no encontrado localmente. Intentando recargar...', subforumValue);
      
      const reloadSuccess = await this.reloadSubforumsSilently();
      
      if (reloadSuccess) {
        // Reintentar busqueda despues de recargar
        selectedSubforum = this.findSubforumById(subforumValue);
      }
      
      // Si despues de recargar sigue sin encontrarse, mostrar error
      if (!selectedSubforum) {
        this.error.set('El subforo seleccionado ya no esta disponible o ha sido eliminado. Por favor, selecciona otro subforo.');
        this.isSubmitting.set(false);
        return;
      }
      
      // Si se encontro despues de recargar, limpiar cualquier mensaje de error previo
      this.error.set('');
    }
    
    // Obtener el forumId del subforum seleccionado
    const forumId = this.getForumId(selectedSubforum);
    
    if (!forumId) {
      this.error.set('Error: El subforo seleccionado no tiene un foro asociado. Por favor, selecciona otro subforo.');
      this.isSubmitting.set(false);
      return;
    }

    // Asegurar que tenemos el ID como string para el envío
    const subforumId = (selectedSubforum as any)._id || (selectedSubforum as any).id;

    // Construir los datos de la publicacion
    const postData: any = {
      title: this.form.value.title?.trim() || '',
      content: this.form.value.content?.trim() || '',
      author: {
        id: currentUser._id || (currentUser as any).id,
        username: currentUser.username
      },
      forum: forumId,
      subforum: subforumId
    };

    console.log('Enviando publicacion:', {
      ...postData,
      subforumName: (selectedSubforum as any).name || (selectedSubforum as any).title,
      forumId: forumId
    });

    this.postService.createPost(postData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          console.log('Publicacion creada exitosamente:', response);
          // Redirigir al post recien creado o al listado
          if (response && response._id) {
            this.router.navigate(['/posts', response._id]);
          } else if (response && (response as any).id) {
            this.router.navigate(['/posts', (response as any).id]);
          } else {
            this.router.navigate(['/posts']);
          }
        },
        error: (err) => {
          console.error('Error al crear publicacion:', err);
          
          // Mostrar mensaje de error especifico del backend
          let errorMessage = 'No se ha podido crear la publicacion.';
          
          if (err?.error?.message) {
            errorMessage = err.error.message;
          } else if (err?.error?.error) {
            errorMessage = err.error.error;
          } else if (err?.message) {
            errorMessage = err.message;
          }
          
          // Manejar errores especificos de HTTP
          if (err?.status === 404) {
            errorMessage = 'El subforo o foro especificado no existe. Por favor, selecciona otro subforo.';
            // Recargar los subforos para actualizar la lista
            this.loadSubforums();
          } else if (err?.status === 403) {
            errorMessage = 'No tienes permisos para publicar en este subforo.';
          } else if (err?.status === 401) {
            errorMessage = 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
            // Redirigir al login despues de 2 segundos
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          }
          
          this.error.set(errorMessage);
        }
      });
  }

  /**
   * Verifica si el subforo seleccionado actualmente es valido.
   * Retorna el nombre del subforo si es valido, null en caso contrario.
   */
  getSelectedSubforumName(): string | null {
    const selectedSubforumId = this.form.value.subforum;
    if (!selectedSubforumId) return null;
    
    const subforum = this.findSubforumById(selectedSubforumId);
    
    if (!subforum) return null;
    
    return (subforum as any).name || (subforum as any).title || null;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Getters para facil acceso en el template
  get title() { return this.form.get('title'); }
  get content() { return this.form.get('content'); }
  get subforumControl() { return this.form.get('subforum'); }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}