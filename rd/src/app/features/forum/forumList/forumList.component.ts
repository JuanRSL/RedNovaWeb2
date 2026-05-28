import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ForumService } from '../../../services/forum.service';
import { Forum } from '../../../models/forum.model';

@Component({
  selector: 'rn-forum-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './forumList.component.html',
  styleUrls:['./forumList.component.css'],
})
export class ForumListComponent implements OnInit {
  private forumService = inject(ForumService);
  
  forums = signal<Forum[]>([]);
  isLoading = signal(true);
  error = signal('');

  ngOnInit() {
    this.loadForums();
  }

  loadForums() {
    this.isLoading.set(true);
    this.error.set('');
    
    this.forumService.getAllForums().subscribe({
      next: (forums) => {
        this.forums.set(forums);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('No se han podido cargar los foros.');
        this.isLoading.set(false);
      }
    });
  }
}