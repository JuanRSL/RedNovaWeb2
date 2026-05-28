import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Comment, CommentsResponse, CreateCommentRequest, VoteResponse } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly api = inject(ApiService);

  // getCommentsByPost ahora acepta parámetros de paginación
  getCommentsByPost(postId: string, page: number = 1, limit: number = 20): Observable<CommentsResponse> {
    return this.api.get<CommentsResponse>(`/comentarios/post/${postId}?page=${page}&limit=${limit}`);
  }

  // createComment necesita enviar 'postId' en el body, no en la URL
  createComment(comment: CreateCommentRequest): Observable<{ message: string; comment: Comment }> {
    const body = {
      content: comment.content,
      postId: comment.postId,      // ← Tu backend espera 'postId'
      parentComment: comment.parentComment || null
    };
    return this.api.post<{ message: string; comment: Comment }>('/comentarios', body);
  }

  // deleteComment también necesita el ID del comentario en la URL, no en el body
  deleteComment(commentId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/comentarios/${commentId}`);
  }

  // upvote y downvote también necesitan el ID del comentario en la URL, no en el body
  upvoteComment(commentId: string): Observable<VoteResponse> {
    return this.api.post<VoteResponse>(`/comentarios/${commentId}/upvote`, {});
  }

  // downvoteComment no estaba implementado, lo agregamos
  downvoteComment(commentId: string): Observable<VoteResponse> {
    return this.api.post<VoteResponse>(`/comentarios/${commentId}/downvote`, {});
  }
}