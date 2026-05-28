// src/app/services/api.service.ts
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  // Método para obtener el token
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Método para crear headers con autorización
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { 
      headers: this.getHeaders(),
      params 
    });
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders()
    });
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, {
      headers: this.getHeaders()
    });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, {
      headers: this.getHeaders()
    });
  }
}