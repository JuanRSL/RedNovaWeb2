// postDetail.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommentListComponent } from '../../comment/comment.component';
import { PostService } from '../../../services/post.service';
import { AuthService } from '../../../services/auth.service';
import { Post } from '../../../models/post.model';

@Component({
  selector: 'rn-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CommentListComponent],
  templateUrl: './postDetail.component.html',
  styleUrls: ['./postDetail.component.css']
})
export class PostDetailComponent implements OnInit {
  post = signal<Post | null>(null);
  error = signal('');
  isLoading = signal(true);

  constructor(
    private route: ActivatedRoute, 
    private postService: PostService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Publicacion no encontrada');
      this.isLoading.set(false);
      return;
    }

    this.postService.getPostById(id).subscribe({
      next: (post) => {
        this.post.set(post);
        if (!post) {
          this.error.set('Publicacion no encontrada');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se ha podido cargar la publicacion.');
        this.isLoading.set(false);
      }
    });
  }

  // ✅ CORREGIDO: Cambiar tipo de 'up' | 'down' a 'upvote' | 'downvote'
  vote(type: 'upvote' | 'downvote') {
    const currentPost = this.post();
    if (!currentPost) {
      return;
    }

    // ✅ CORREGIDO: Usar _id o id correctamente
    const id = currentPost._id || currentPost.id;
    if (!id) {
      return;
    }

    this.postService.votePost(id, type).subscribe({
      next: ({ score }) => {
        this.post.set({ ...currentPost, score });
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se ha podido votar la publicacion.');
      }
    });
  }

  // Método auxiliar para el template (si usas 'up'/'down' en el template)
  voteUp() {
    this.vote('upvote');
  }

  voteDown() {
    this.vote('downvote');
  }

  // Verificar si el usuario actual puede editar/eliminar
  canModify(): boolean {
    const currentPost = this.post();
    const currentUser = this.authService.currentUser();
    
    if (!currentPost || !currentUser) return false;
    
    const authorId = typeof currentPost.author === 'string' 
      ? currentPost.author 
      : currentPost.author?.id;
    
    const userId = currentUser._id || currentUser.id;
    const isAuthor = authorId === userId;
    const isAdmin = !!currentUser.roles?.includes('admin');
    const isModerator = !!currentUser.roles?.includes('moderator');
    
    return !!(isAuthor || isAdmin || isModerator);
  }

  // Verificar si el usuario ya votó positivamente
  hasUpvoted(): boolean {
    const currentPost = this.post();
    const currentUser = this.authService.currentUser();
    if (!currentPost || !currentUser) return false;
    
    const userId = currentUser._id || currentUser.id;
    return currentPost.upvotes?.includes(userId as string) || false;
  }

  // Verificar si el usuario ya votó negativamente
  hasDownvoted(): boolean {
    const currentPost = this.post();
    const currentUser = this.authService.currentUser();
    if (!currentPost || !currentUser) return false;
    
    const userId = currentUser._id || currentUser.id;
    return currentPost.downvotes?.includes(userId as string) || false;
  }
}