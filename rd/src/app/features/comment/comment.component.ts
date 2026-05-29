// src/app/features/comment/comment.component.ts
import { Component, Input, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { Comment, CreateCommentRequest, CommentsResponse } from '../../models/comment.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'rn-comment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css']
})
export class CommentListComponent implements OnInit, OnDestroy {
  @Input() postId!: string | undefined;

  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  comments = signal<Comment[]>([]);
  totalComments = signal<number>(0);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  error = signal<string>('');
  isSubmitting = signal<boolean>(false);
  submitError = signal<string>('');
  replyingTo = signal<string | null>(null);
  isLoggedIn = signal<boolean>(false);

  commentForm = new FormGroup({
    content: new FormControl<string>('', { nonNullable: true, validators: Validators.required })
  });

  replyForm = new FormGroup({
    content: new FormControl<string>('', { nonNullable: true, validators: Validators.required })
  });

  ngOnInit(): void {
    this.isLoggedIn.set(!!this.authService.getToken());
    this.loadComments();
  }

  loadComments(): void {
    this.isLoading.set(true);
    this.error.set('');
    if (!this.postId) {
      this.comments.set([]);
      this.totalComments.set(0);
      this.totalPages.set(1);
      this.isLoading.set(false);
      return;
    }

    this.commentService.getCommentsByPost(this.postId, this.currentPage(), 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CommentsResponse): void => {
          this.comments.set(response.comments);
          this.totalComments.set(response.totalComments);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (err: Error | any): void => {
          console.error('Error loading comments:', err);
          this.error.set('Error al cargar comentarios');
          this.isLoading.set(false);
        }
      });
  }

submitComment(): void {
  if (this.commentForm.invalid) return;

  this.isSubmitting.set(true);
  this.submitError.set('');

  //Asegurar que content sea string, nunca undefined
  const content = this.commentForm.value.content || '';
  
  if (!content.trim()) {
    this.submitError.set('El comentario no puede estar vacío');
    this.isSubmitting.set(false);
    return;
  }

  if (!this.postId) {
    this.submitError.set('No se encontró la publicación para comentar.');
    this.isSubmitting.set(false);
    return;
  }

  const request: CreateCommentRequest = {
    content: content,  //Ahora es string, no string | undefined
    postId: this.postId
  };

  this.commentService.createComment(request)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (): void => {
        this.commentForm.reset();
        this.isSubmitting.set(false);
        this.loadComments();
      },
      error: (err: Error | any): void => {
        console.error('Error creating comment:', err);
        this.submitError.set(err?.error?.message || 'Error al publicar comentario');
        this.isSubmitting.set(false);
      }
    });
}

submitReply(parentCommentId: string): void {
  if (this.replyForm.invalid) return;

  this.isSubmitting.set(true);
  this.submitError.set('');

  // ✅ Asegurar que content sea string, nunca undefined
  const content = this.replyForm.value.content || '';
  
  if (!content.trim()) {
    this.submitError.set('La respuesta no puede estar vacía');
    this.isSubmitting.set(false);
    return;
  }

  if (!this.postId) {
    this.submitError.set('No se encontró la publicación para responder.');
    this.isSubmitting.set(false);
    return;
  }

  const request: CreateCommentRequest = {
    content: content,  // ← Ahora es string, no string | undefined
    postId: this.postId,
    parentComment: parentCommentId
  };

  this.commentService.createComment(request)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (): void => {
        this.replyForm.reset();
        this.isSubmitting.set(false);
        this.replyingTo.set(null);
        this.loadComments();
      },
      error: (err: Error | any): void => {
        console.error('Error creating reply:', err);
        this.submitError.set(err?.error?.message || 'Error al publicar respuesta');
        this.isSubmitting.set(false);
      }
    });
}
 

  startReply(commentId: string): void {
    this.replyingTo.set(commentId);
    this.replyForm.reset();
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyForm.reset();
  }

  upvoteComment(commentId: string): void {
    this.commentService.upvoteComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (): void => this.loadComments(),
        error: (err: Error | any): void => console.error('Error al dar upvote:', err)
      });
  }

  downvoteComment(commentId: string): void {
    this.commentService.downvoteComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (): void => this.loadComments(),
        error: (err: Error | any): void => console.error('Error al dar downvote:', err)
      });
  }

  deleteComment(commentId: string): void {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      this.commentService.deleteComment(commentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (): void => this.loadComments(),
          error: (err: Error | any): void => console.error('Error al eliminar:', err)
        });
    }
  }

  hasUpvoted(comment: Comment): boolean {
    const currentUser = this.authService.currentUser();
    const currentUserId = currentUser?._id;
    return currentUserId ? comment.upvotes.includes(currentUserId) : false;
  }

  hasDownvoted(comment: Comment): boolean {
    const currentUser = this.authService.currentUser();
    const currentUserId = currentUser?._id;
    return currentUserId ? comment.downvotes.includes(currentUserId) : false;
  }

  canDelete(comment: Comment): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    const currentUserId = currentUser._id;
    if (!currentUserId) return false;
    
    const isAuthor = comment.author._id === currentUserId;
    const isAdmin = !!currentUser.roles?.includes('admin');
    const isModerator = !!currentUser.roles?.includes('moderator');
    
    return !!(isAuthor || isAdmin || isModerator);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadComments();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  topLevelComments() {
  return this.comments().filter(c => !c.parentComment);
}

getReplies(commentId: string) {
  return this.comments().filter(c => c.parentComment === commentId);
}
}
