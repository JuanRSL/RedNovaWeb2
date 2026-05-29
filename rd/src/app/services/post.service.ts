// post.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, throwError, map } from 'rxjs';
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
    return this.api.get<any>(`/posts?page=${page}&limit=${limit}`)
      .pipe(
        map(res => {
          const data = Array.isArray(res) ? { posts: res, total: res.length } : res;
          return this.normalizePostsResponse(data);
        }),
        catchError(this.handleError));
  }

  getPostById(id: string): Observable<Post> {
    return this.api.get<Post>(`/posts/${id}`)
      .pipe(catchError(this.handleError));
  }

  getPostsBySubforum(subforumId: string, page: number = 1, limit: number = 10): Observable<{ posts: Post[]; total: number }> {
    return this.api.get<any>(`/posts/subforum/${subforumId}?page=${page}&limit=${limit}`)
      .pipe(
        map(res => {
          const data = Array.isArray(res) ? { posts: res, total: res.length } : res;
          return this.normalizePostsResponse(data);
        }),
        catchError(this.handleError));
  }

  getPostsByForum(forumId: string, page: number = 1, limit: number = 10): Observable<{ posts: Post[]; total: number }> {
    return this.api.get<any>(`/posts/forum/${forumId}?page=${page}&limit=${limit}`)
      .pipe(
        map(res => {
          const data = Array.isArray(res) ? { posts: res, total: res.length } : res;
          return this.normalizePostsResponse(data);
        }),
        catchError(this.handleError));
  }

  private normalizePostsResponse(data: { posts: any[], total: number }) {
    return {
      ...data,
      posts: (data.posts || []).map(p => ({ 
        ...p, 
        id: p.id || p._id,
        author: typeof p.author === 'object' ? { ...p.author, id: p.author?.id || p.author?._id } : p.author
      }))
    };
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
    const paths = [
      `/posts/${id}/vote`,
      `/posts/${id}/vote/${voteType}`,
      `/posts/${id}/${voteType}`,
      `/posts/vote/${id}`,
      `/posts/${voteType}/${id}`,
      `/posts/${id}/votes`,
      `/posts/${id}/votes/${voteType}`
    ];

    return this.tryPaths(paths, id, voteType);
  }

  private tryPaths(paths: string[], id: string, voteType: 'upvote' | 'downvote', index = 0): Observable<{ score: number }> {
    if (index >= paths.length) {
      return throwError(() => ({ status: 404, message: 'No se encontró la ruta de votación del backend' }));
    }

    const path = paths[index];
    const body = path.endsWith('/vote') || path.includes('/vote/') || path.endsWith('/votes') || path.includes('/votes/')
      ? { voteType }
      : {};

    return this.api.post<{ score: number }>(path, body).pipe(
      catchError((err: any) => {
        if (err?.status === 404) {
          return this.tryPaths(paths, id, voteType, index + 1);
        }
        return throwError(() => err);
      })
    );
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