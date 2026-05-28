import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ForumService } from '../../../services/forum.service';
import { Forum } from '../../../models/forum.model';

@Component({
  selector: 'rn-forum-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './forumDetail.component.html',
  styleUrls: ['./forumDetail.component.css']
})
export class ForumDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private forumService = inject(ForumService);
  
  forum = signal<Forum | null>(null);
  isLoading = signal(true);
  error = signal('');

  ngOnInit() {
    const forumId = this.route.snapshot.paramMap.get('id');
    if (forumId) {
      this.loadForum(forumId);
    } else {
      this.error.set('Invalid forum ID');
      this.isLoading.set(false);
    }
  }

  loadForum(id: string) {
    this.isLoading.set(true);
    this.error.set('');
    
    this.forumService.getForumById(id).subscribe({
      next: (forum) => {
        this.forum.set(forum);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('No se ha podido cargar los foros.');
        this.isLoading.set(false);
      }
    });
  }
}