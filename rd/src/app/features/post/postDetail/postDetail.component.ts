import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostService } from '../../../services/post.service';
import { Post } from '../../../models/post.model';

@Component({
  selector: 'rn-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './postDetail.component.html',
  styleUrls: ['./postDetail.component.css']
})
export class PostDetailComponent implements OnInit {
  post = signal<Post | null>(null);
  error = signal('');
  isLoading = signal(true);

  constructor(private route: ActivatedRoute, private postService: PostService) {}

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

  vote(type: 'up' | 'down') {
    const currentPost = this.post();
    if (!currentPost) {
      return;
    }

    const id = currentPost.id || currentPost.id;
    if (!id) {
      return;
    }

    this.postService.votePost(id, type).subscribe({
      next: ({ score }) => {
        this.post.set({ ...currentPost, score });
      },
      error: (err) => this.error.set(err?.error?.message || 'No se ha podido votar la publicacion.')
    });
  }
}