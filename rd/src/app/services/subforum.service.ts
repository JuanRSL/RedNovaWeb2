import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Subforum } from '../models/subforum.model';

@Injectable({
  providedIn: 'root'
})
export class SubforumService {
  private readonly api = inject(ApiService);

  getSubforums(forumId?: string): Observable<Subforum[]> {
    let params = new HttpParams();
    if (forumId) {
      params = params.set('forumId', forumId);
    }
    return this.api.get<Subforum[]>('/subforums', params);
  }

  createSubforum(data: { name: string; slug?: string; description?: string; forumId: string }) {
    return this.api.post<{ message: string; subforum: Subforum }>('/subforums', data);
  }
}