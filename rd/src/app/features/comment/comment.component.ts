import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { Comment, CreateCommentRequest } from '../../models/comment.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'rn-comment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css']
})
export class CommentListComponent implements OnInit {
  @Input() postId!: string;

  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  comments = signal<Comment[]>([]);
  totalComments = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);
  isLoading = signal(false);
  error = signal('');
  isSubmitting = signal(false);
  submitError = signal('');
  replyingTo = signal<string | null>(null);
  isLoggedIn = signal(false);

  commentForm = new FormGroup({
    content: new FormControl('', Validators.required)
  });

  replyForm = new FormGroup({
    content: new FormControl('', Validators.required)
  });

  ngOnInit() {
    this.isLoggedIn.set(!!this.authService.getToken());
    this.loadComments();
  }

  loadComments() {
    this.isLoading.set(true);
    this.error.set('');

    this.commentService.getCommentsByPost(this.postId, this.currentPage(), 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.comments.set(response.comments);
          this.totalComments.set(response.totalComments);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load comments');
          this.isLoading.set(false);
        }
      });
  }

  submitComment() {
    if (this.commentForm.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set('');

    const request: CreateCommentRequest = {
      content: this.commentForm.value.content || '',
      postId: this.postId
    };

    this.commentService.createComment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.commentForm.reset();
          this.isSubmitting.set(false);
          this.loadComments();
        },
        error: (err) => {
          this.submitError.set(err?.error?.message || 'Failed to post comment');
          this.isSubmitting.set(false);
        }
      });
  }

  startReply(commentId: string) {
    this.replyingTo.set(commentId);
    this.replyForm.reset();
  }

  cancelReply() {
    this.replyingTo.set(null);
    this.replyForm.reset();
  }

  submitReply(parentCommentId: string) {
    if (this.replyForm.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set('');

    const request: CreateCommentRequest = {
      content: this.replyForm.value.content || '',
      postId: this.postId,
      parentComment: parentCommentId
    };

    this.commentService.createComment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.replyForm.reset();
          this.isSubmitting.set(false);
          this.replyingTo.set(null);
          this.loadComments();
        },
        error: (err) => {
          this.submitError.set(err?.error?.message || 'Failed to post reply');
          this.isSubmitting.set(false);
        }
      });
  }

  upvoteComment(commentId: string) {
    this.commentService.upvoteComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadComments(),
        error: (err) => console.error('Failed to upvote:', err)
      });
  }

  downvoteComment(commentId: string) {
    this.commentService.downvoteComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadComments(),
        error: (err) => console.error('Failed to downvote:', err)
      });
  }

  deleteComment(commentId: string) {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentService.deleteComment(commentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.loadComments(),
          error: (err) => console.error('Failed to delete:', err)
        });
    }
  }

  hasUpvoted(comment: Comment): boolean {
    const currentUser = this.authService.currentUser();
    const currentUserId = currentUser?._id ?? currentUser?.id;
    return currentUserId ? comment.upvotes.includes(currentUserId) : false;
  }

  hasDownvoted(comment: Comment): boolean {
    const currentUser = this.authService.currentUser();
    const currentUserId = currentUser?._id ?? currentUser?.id;
    return currentUserId ? comment.downvotes.includes(currentUserId) : false;
  }

  canDelete(comment: Comment): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    const currentUserId = currentUser._id ?? currentUser.id;
    if (!currentUserId) return false;
    
    const isAuthor = comment.author._id === currentUserId;
    const isAdmin = !!currentUser.roles?.includes('admin');
    const isModerator = !!currentUser.roles?.includes('moderator');
    
    return !!(isAuthor || isAdmin || isModerator);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadComments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}