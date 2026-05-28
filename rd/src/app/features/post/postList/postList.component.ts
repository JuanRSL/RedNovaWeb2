// postList.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PostService } from '../../../services/post.service';
import { Post } from '../../../models/post.model';

@Component({
  selector: 'rn-post-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './postList.component.html',
  styleUrls: ['./postList.component.css']
})
export class PostListComponent implements OnInit {
  posts = signal<Post[]>([]);
  isLoading = signal(false);
  error = signal('');
  totalPosts = signal(0);

  constructor(
    private postService: PostService, 
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPosts();
  }

  // ✅ CORREGIDO: Manejar la estructura de respuesta correcta
  loadPosts(page: number = 1, limit: number = 10) {
    this.isLoading.set(true);
    this.error.set('');

    this.postService.getPosts(page, limit).subscribe({
      next: (response) => {
        // response tiene estructura: { posts: Post[], total: number }
        this.posts.set(response.posts);
        this.totalPosts.set(response.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to load posts.');
        this.isLoading.set(false);
      }
    });
  }

  // ✅ CORREGIDO: Cambiar tipo de 'up' | 'down' a 'upvote' | 'downvote'
  vote(post: Post, type: 'upvote' | 'downvote') {
    const id = post._id || post.id;
    if (!id) {
      return;
    }

    this.postService.votePost(id, type).subscribe({
      next: (result) => {
        const updated = this.posts().map((item) => {
          const itemId = item._id || item.id;
          if (itemId === id) {
            return { ...item, score: result.score };
          }
          return item;
        });
        this.posts.set(updated);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to cast vote.');
      }
    });
  }

  // Método auxiliar para votar positivo desde el template
  voteUp(post: Post) {
    this.vote(post, 'upvote');
  }

  // Método auxiliar para votar negativo desde el template
  voteDown(post: Post) {
    this.vote(post, 'downvote');
  }

  deletePost(post: Post) {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const id = post._id || post.id;
    if (!id) {
      return;
    }

    this.postService.deletePost(id).subscribe({
      next: () => this.loadPosts(),
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to delete post.');
      }
    });
  }

  canDelete(post: Post): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }

    // Obtener el ID del autor
    const authorId = typeof post.author === 'string' 
      ? post.author 
      : post.author?.id;
    
    const userId = user._id || user.id;
    const isAuthor = authorId === userId;
    const isAdmin = !!user.roles?.includes('admin');
    const isModerator = !!user.roles?.includes('moderator');

    return !!(isAuthor || isAdmin || isModerator);
  }

  // Verificar si el usuario ya votó positivamente
  hasUpvoted(post: Post): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    
    const userId = currentUser._id || currentUser.id;
    return post.upvotes?.includes(userId as string) || false;
  }

  // Verificar si el usuario ya votó negativamente
  hasDownvoted(post: Post): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    
    const userId = currentUser._id || currentUser.id;
    return post.downvotes?.includes(userId as string) || false;
  }

  refreshPosts() {
    this.loadPosts();
  }
}