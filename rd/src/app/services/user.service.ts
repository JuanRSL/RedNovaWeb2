import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly api = inject(ApiService);

  // Update profile
  updateProfile(data: any): Observable<any> {
    return this.api.put('/user/profile', data);
  }

  // Follow / unfollow actions (backend should handle toggle semantics)
  toggleFollowUser(userId: string): Observable<any> {
    return this.api.post(`/users/${userId}/follow`, {});
  }

  toggleFollowSubforum(subforumId: string): Observable<any> {
    return this.api.post(`/subforums/${subforumId}/follow`, {});
  }

  toggleFollowForum(forumId: string): Observable<any> {
    return this.api.post(`/forums/${forumId}/follow`, {});
  }
}