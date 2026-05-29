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
  voteError = signal<string>('');
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
        error: (err: any): void => {
          this.error.set('Error al cargar comentarios');
          this.isLoading.set(false);
        }
      });
  }

  submitComment(): void {
    if (this.commentForm.invalid) return;
    this.isSubmitting.set(true);
    this.submitError.set('');

    const content = this.commentForm.value.content || '';
    if (!content.trim()) {
      this.submitError.set('El comentario no puede estar vacío');
      this.isSubmitting.set(false);
      return;
    }
    if (!this.postId) {
      this.submitError.set('No se encontró la publicación.');
      this.isSubmitting.set(false);
      return;
    }

    const request: CreateCommentRequest = { content, postId: this.postId };

    this.commentService.createComment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (): void => {
          this.commentForm.reset();
          this.isSubmitting.set(false);
          this.loadComments();
        },
        error: (err: any): void => {
          this.submitError.set(err?.error?.message || 'Error al publicar comentario');
          this.isSubmitting.set(false);
        }
      });
  }

  submitReply(parentCommentId: string): void {
    if (this.replyForm.invalid) return;
    this.isSubmitting.set(true);
    this.submitError.set('');

    const content = this.replyForm.value.content || '';
    if (!content.trim()) {
      this.submitError.set('La respuesta no puede estar vacía');
      this.isSubmitting.set(false);
      return;
    }
    if (!this.postId) {
      this.submitError.set('No se encontró la publicación.');
      this.isSubmitting.set(false);
      return;
    }

    const request: CreateCommentRequest = { content, postId: this.postId, parentComment: parentCommentId };

    this.commentService.createComment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (): void => {
          this.replyForm.reset();
          this.isSubmitting.set(false);
          this.replyingTo.set(null);
          this.loadComments();
        },
        error: (err: any): void => {
          this.submitError.set(err?.error?.message || 'Error al publicar respuesta');
          this.isSubmitting.set(false);
        }
      });
  }

  startReply(commentId: string): void {
    this.replyingTo.set(commentId);
    this.replyForm.reset();
    setTimeout(() => {
      const el = document.getElementById('reply-form-' + commentId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyForm.reset();
  }

  upvoteComment(commentId: string): void {
    this.voteError.set('');
    const user = this.authService.currentUser();
    if (!user?._id) {
      this.voteError.set('Debes iniciar sesión para votar');
      return;
    }

    const prev = this.comments();
    const userId = user._id;
    const updated = prev.map(c => {
      if (c._id !== commentId) return c;
      const hasUp = c.upvotes.includes(userId);
      const hasDown = c.downvotes.includes(userId);
      const upvotes = hasUp ? c.upvotes.filter(id => id !== userId) : [...c.upvotes, userId];
      const downvotes = hasDown ? c.downvotes.filter(id => id !== userId) : c.downvotes.filter(id => id !== userId);
      return { ...c, upvotes, downvotes } as Comment;
    });

    this.comments.set(updated);

    this.commentService.upvoteComment(commentId, this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (): void => this.loadComments(),
        error: (err: any): void => {
          console.error('Error upvote:', err);
          this.voteError.set(err?.error?.message || 'Error al registrar voto');
          this.comments.set(prev);
        }
      });
  }

  downvoteComment(commentId: string): void {
    this.voteError.set('');
    const user = this.authService.currentUser();
    if (!user?._id) {
      this.voteError.set('Debes iniciar sesión para votar');
      return;
    }

    const prev = this.comments();
    const userId = user._id;
    const updated = prev.map(c => {
      if (c._id !== commentId) return c;
      const hasDown = c.downvotes.includes(userId);
      const hasUp = c.upvotes.includes(userId);
      const downvotes = hasDown ? c.downvotes.filter(id => id !== userId) : [...c.downvotes, userId];
      const upvotes = hasUp ? c.upvotes.filter(id => id !== userId) : c.upvotes.filter(id => id !== userId);
      return { ...c, upvotes, downvotes } as Comment;
    });

    this.comments.set(updated);

    this.commentService.downvoteComment(commentId, this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (): void => this.loadComments(),
        error: (err: any): void => {
          console.error('Error downvote:', err);
          this.voteError.set(err?.error?.message || 'Error al registrar voto');
          this.comments.set(prev);
        }
      });
  }

  deleteComment(commentId: string): void {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      this.commentService.deleteComment(commentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (): void => this.loadComments(),
          error: (err: any): void => console.error('Error eliminar:', err)
        });
    }
  }

  hasUpvoted(comment: Comment): boolean {
    const id = this.authService.currentUser()?._id;
    return id ? comment.upvotes.includes(id) : false;
  }

  hasDownvoted(comment: Comment): boolean {
    const id = this.authService.currentUser()?._id;
    return id ? comment.downvotes.includes(id) : false;
  }

  canDelete(comment: Comment): boolean {
    const user = this.authService.currentUser();
    if (!user?._id) return false;
    return comment.author._id === user._id
      || !!user.roles?.includes('admin')
      || !!user.roles?.includes('moderator');
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadComments();
    }
  }

  topLevelComments(): Comment[] {
    return this.comments().filter(c => !c.parentComment);
  }

  getReplies(commentId: string): Comment[] {
    return this.comments().filter(c => c.parentComment === commentId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}