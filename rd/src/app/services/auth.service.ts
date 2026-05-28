import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  currentUser = signal<User | null>(null);

  constructor() {
    //Cargar la sesión cuando se crea el servicio
    this.loadSession().subscribe();
  }

  login(credentials: { identifier: string; password: string }) {
    return this.api.post<AuthResponse>('/usuarios/login', {
      email: credentials.identifier,
      password: credentials.password
    }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(userData: { username: string; email: string; password: string; roles?: string[] }) {
    return this.api.post<AuthResponse>('/usuarios/register', userData).pipe(
      tap(res => this.saveSession(res))
    );
  }

  loadSession() {
    const token = this.getToken();
    if (!token) {
      this.currentUser.set(null);
      return of(null);
    }

    return this.api.get<User>('/usuarios/me').pipe(
      map(user => ({ ...user, id: user._id })), // Asegura que 'id' (opcional) siempre sea igual a '_id' (principal)
      tap(user => {
        this.currentUser.set(user);
        console.log('Sesión cargada:', user.username);
      }),
      catchError((error) => {
        console.error('Error cargando sesión:', error);
        this.currentUser.set(null);
        return of(null);
      })
    );
  }

  updateProfile(profile: { email?: string; currentPassword?: string; newPassword?: string }) {
    return this.api.put<{ message: string }>('/usuarios/me', profile);
  }

  private saveSession(res: AuthResponse) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', res.token);
    }

    const currentUser: User = {
      _id: res.user.id,
      id: res.user.id,
      username: res.user.username,
      email: res.user.email,
      roles: res.user.roles,
      followingUsers: [],
      followingSubforums: [],
      followingForums: [],
      moderatedSubforums: [],
      moderatedPosts: [],
      moderatedComments: [],
      createdAt: '',
      updatedAt: ''
    };
    this.currentUser.set(currentUser);
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }
}