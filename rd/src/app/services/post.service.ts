// post.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private api = inject(ApiService);

  createPost(postData: Partial<Post>): Observable<Post> {
    return this.api.post<Post>('/posts', postData)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getPosts(page: number = 1, limit: number = 10): Observable<{ posts: Post[]; total: number }> {
    return this.api.get<{ posts: Post[]; total: number }>(`/posts?page=${page}&limit=${limit}`)
      .pipe(catchError(this.handleError));
  }

  getPostById(id: string): Observable<Post> {
    return this.api.get<Post>(`/posts/${id}`)
      .pipe(catchError(this.handleError));
  }

  getPostsBySubforum(subforumId: string, page: number = 1, limit: number = 10): Observable<{ posts: Post[]; total: number }> {
    return this.api.get<{ posts: Post[]; total: number }>(`/posts/subforum/${subforumId}?page=${page}&limit=${limit}`)
      .pipe(catchError(this.handleError));
  }

  getPostsByForum(forumId: string, page: number = 1, limit: number = 10): Observable<{ posts: Post[]; total: number }> {
    return this.api.get<{ posts: Post[]; total: number }>(`/posts/forum/${forumId}?page=${page}&limit=${limit}`)
      .pipe(catchError(this.handleError));
  }

  updatePost(id: string, postData: Partial<Post>): Observable<Post> {
    return this.api.put<Post>(`/posts/${id}`, postData)
      .pipe(catchError(this.handleError));
  }

  deletePost(id: string): Observable<void> {
    return this.api.delete<void>(`/posts/${id}`)
      .pipe(catchError(this.handleError));
  }

  votePost(id: string, voteType: 'upvote' | 'downvote'): Observable<{ score: number }> {
    return this.api.post<{ score: number }>(`/posts/${id}/vote`, { voteType })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error in PostService:', error);
    
    let errorMessage = 'Ha ocurrido un error en la comunicación con el servidor';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || error.error?.error || `Error ${error.status}: ${error.statusText}`;
    }
    
    return throwError(() => ({ 
      status: error.status, 
      message: errorMessage,
      error: error.error 
    }));
  }
}