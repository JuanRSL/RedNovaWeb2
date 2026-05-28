import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UpdateProfileRequest, FollowResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly api = inject(ApiService);

  getMyProfile(): Observable<User> {
    return this.api.get<User>('/api/usuarios/me');
  }

  updateProfile(profile: UpdateProfileRequest): Observable<{ message: string }> {
    return this.api.put<{ message: string }>('/api/usuarios/me', profile);
  }

  followUser(userId: string): Observable<FollowResponse> {
    return this.api.post<FollowResponse>(`/api/usuarios/users/${userId}/follow`, {});
  }

  followSubforum(subforumId: string): Observable<FollowResponse> {
    return this.api.post<FollowResponse>(`/api/usuarios/subforums/${subforumId}/follow`, {});
  }

  followForum(forumId: string): Observable<FollowResponse> {
    return this.api.post<FollowResponse>(`/api/usuarios/forums/${forumId}/follow`, {});
  }
}