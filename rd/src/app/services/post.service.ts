import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Post } from '../models/post.model';
import { Observable } from 'rxjs';

// Servicio para manejar operaciones relacionadas con los posts
@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly api = inject(ApiService);

  getPosts(filter: { forumId?: string; subforumId?: string; search?: string } = {}): Observable<Post[]> {
    let params = new HttpParams();

    if (filter.forumId) {
      params = params.set('forumId', filter.forumId);
    }
    if (filter.subforumId) {
      params = params.set('subforumId', filter.subforumId);
    }
    if (filter.search) {
      params = params.set('search', filter.search);
    }

    return this.api.get<Post[]>('/posts', params);
  }

  getPostById(id: string) {
    return this.getPosts().pipe(
      map(posts => posts.find(post => post.id === id || post.id === id) ?? null)
    );
  }

  createPost(post: { title: string; content: string; subforum: string; forum?: string }) {
    return this.api.post<{ message: string; newPost: Post }>('/posts', post);
  }

  deletePost(id: string) {
    return this.api.delete<{ message: string }>(`/posts/delete/${id}`);
  }

  votePost(postId: string, voteType: 'up' | 'down') {
    return this.api.post<{ message: string; score: number }>('/posts/vote', {
      postId,
      voteType
    });
  }
}