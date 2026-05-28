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

  constructor(private postService: PostService, public authService: AuthService) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.isLoading.set(true);
    this.error.set('');

    this.postService.getPosts().subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to load posts.');
        this.isLoading.set(false);
      }
    });
  }

  vote(post: Post, type: 'up' | 'down') {
    const id = post.id || post.id;
    if (!id) {
      return;
    }

    this.postService.votePost(id, type).subscribe({
      next: (result) => {
        const updated = this.posts().map((item) => {
          if (item.id === post.id || item.id === post.id) {
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

  deletePost(post: Post) {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const id = post.id || post.id;
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

  canDelete(post: Post) {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }

    const isAuthor = post.author?.username === user.username;
    const isAdmin = user.roles?.includes('admin');
    const isModerator = user.roles?.includes('moderator');

    return isAuthor || isAdmin || isModerator;
  }
}
