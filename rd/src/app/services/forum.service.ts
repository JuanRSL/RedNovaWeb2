import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Forum, CreateForumRequest } from '../models/forum.model';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly api = inject(ApiService);

  getAllForums(): Observable<Forum[]> {
    return this.api.get<Forum[]>('/api/forums');
  }

  getForumById(id: string): Observable<Forum> {
    return this.api.get<Forum>(`/api/forums/${id}`);
  }

  createForum(forum: CreateForumRequest): Observable<{ message: string; forum: Forum }> {
    return this.api.post<{ message: string; forum: Forum }>('/api/forums', forum);
  }

  deleteForum(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/api/forums/${id}`);
  }
}