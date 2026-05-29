import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Subforum } from '../models/subforum.model';

@Injectable({
  providedIn: 'root'
})
export class SubforumService {
  private readonly api = inject(ApiService);

  // En el servicio SubforumService, puedes mapear la respuesta
getSubforums(forumId?: string): Observable<Subforum[]> {
  let params = new HttpParams();
  if (forumId) {
    params = params.set('forumId', forumId);
  }
  return this.api.get<Subforum[]>('/subforums', params).pipe(
    map(subforums => subforums.map(sf => ({
      ...sf,
      forum: (sf as any).forumId || sf.forum // Normalizar a 'forum'
    })))
  );
}

  createSubforum(data: { name: string; slug?: string; description?: string; forum: string; author?: any }) {
    return this.api.post<{ message: string; subforum: Subforum }>('/subforums', data);
  }
  
  getSubforumById(id: string): Observable<Subforum> {
    return this.api.get<Subforum>(`/subforums/${id}`);
  }

}