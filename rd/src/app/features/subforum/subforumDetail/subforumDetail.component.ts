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
    const slug = this.route.snapshot.paramMap.get('slug');
    const key = id || slug;
    if (key) {
      this.loadSubforum(key);
    }
  }

  loadSubforum(id: string) {
    this.isLoading.set(true);
    this.subforumService.getSubforumById(id).subscribe({
      next: (sf) => {
        this.subforum.set(sf);
        this.isLoading.set(false);
      },
      error: () => {
        // Si falló por ID, intentamos buscar por slug
        this.subforumService.getSubforumBySlug(id).subscribe({
          next: (sf) => {
            if (sf) {
              this.subforum.set(sf);
            } else {
              this.error.set('No se encontró el subforo.');
            }
            this.isLoading.set(false);
          },
          error: () => {
            this.error.set('No se pudo cargar la información del subforo.');
            this.isLoading.set(false);
          }
        });
      }
    });
  }
}