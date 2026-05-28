import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'rn-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Usar el signal del AuthService directamente
  user = this.authService.currentUser;
  isLoading = signal(true);
  isUpdating = signal(false);
  error = signal('');
  successMessage = signal('');
  activeTab = signal<'profile' | 'following'>('profile');

  profileForm = new FormGroup({
    email: new FormControl('', [Validators.email]),
    currentPassword: new FormControl(''),
    newPassword: new FormControl('', [Validators.minLength(6)])
  });

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.error.set('');

    //Verificar si ya tenemos el usuario
    const currentUser = this.authService.currentUser();
    
    if (currentUser) {
      this.profileForm.patchValue({ email: currentUser.email });
      this.isLoading.set(false);
      
      // Recargar por si hay cambios recientes
      this.authService.loadSession().subscribe({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false)
      });
    } else {
      // Si no hay usuario, intentar cargar sesión
      this.authService.loadSession().subscribe({
        next: (user) => {
          if (user) {
            this.profileForm.patchValue({ email: user.email });
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('No se ha podido cargar el perfil.');
          this.isLoading.set(false);
        }
      });
    }
  }

  updateProfile() {
    if (this.profileForm.invalid) {
      this.error.set('Por favor, complete los campos correctamente.');
      return;
    }

    const formValue = this.profileForm.value;
    if (!formValue.email && !formValue.newPassword) {
      this.error.set('No hay cambios para actualizar.');
      return;
    }

    // Validar que si hay nueva contraseña, también esté la actual
    if (formValue.newPassword && !formValue.currentPassword) {
      this.error.set('Debe ingresar su contraseña actual para cambiarla.');
      return;
    }

    this.isUpdating.set(true);
    this.error.set('');
    this.successMessage.set('');

    const updateData: any = {};
    if (formValue.email) updateData.email = formValue.email;
    if (formValue.newPassword) {
      updateData.currentPassword = formValue.currentPassword;
      updateData.newPassword = formValue.newPassword;
    }

    this.userService.updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message || 'Perfil actualizado correctamente.');
          this.isUpdating.set(false);
          this.profileForm.patchValue({ currentPassword: '', newPassword: '' });
          // Recargar la sesión para actualizar los datos
          this.authService.loadSession().subscribe();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se ha podido actualizar el perfil.');
          this.isUpdating.set(false);
        }
      });
  }

  unfollowUser(userId: string) {
    this.userService.toggleFollowUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadProfile(),
        error: (err) => {
          this.error.set('Error al dejar de seguir al usuario.');
        }
      });
  }

  unfollowSubforum(subforumId: string) {
    this.userService.toggleFollowSubforum(subforumId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadProfile(),
        error: (err) => {
          this.error.set('Error al dejar de seguir el subforo.');
        }
      });
  }

  unfollowForum(forumId: string) {
    this.userService.toggleFollowForum(forumId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadProfile(),
        error: (err) => {
          this.error.set('Error al dejar de seguir el foro.');
        }
      });
  }

  setActiveTab(tab: 'profile' | 'following') {
    this.activeTab.set(tab);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}