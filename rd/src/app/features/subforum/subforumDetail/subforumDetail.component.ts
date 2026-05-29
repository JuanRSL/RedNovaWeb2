import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubforumService } from '../../../services/subforum.service';
import { Subforum } from '../../../models/subforum.model';
import { PostService } from '../../../services/post.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'rn-subforum-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './subforumDetail.component.html',
  styleUrls: ['./subforumDetail.component.css']
})
export class SubforumDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private subforumService = inject(SubforumService);
  private postService = inject(PostService);

  subforum = signal<Subforum | null>(null);
  posts = signal<any[]>([]);
  isLoading = signal(true);
  error = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSubforum(id);
    }
  }

  loadSubforum(id: string) {
    this.isLoading.set(true);
    this.subforumService.getSubforumById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (sf) => {
          this.subforum.set(sf);
          // Aquí podrías cargar también los posts filtrados por este subforo
          // this.postService.getPostsBySubforum(id).subscribe(posts => this.posts.set(posts));
        },
        error: () => {
          this.error.set('No se pudo cargar la información del subforo.');
        }
      });
  }
}