import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { apiUrl } from './api-url';
import { AuthApi } from './auth-api';
import { Track } from './music-api';

@Injectable({ providedIn: 'root' })
export class FavoriteApi {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApi);
  private readonly apiUrl = apiUrl('favorites');

  list(): Observable<Track[]> {
    return this.http.get<Track[]>(this.apiUrl, { headers: this.authApi.authHeaders() });
  }

  add(track: Track): Observable<Track> {
    return this.http.post<Track>(this.apiUrl, track, { headers: this.authApi.authHeaders() });
  }

  remove(trackId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(trackId)}`, {
      headers: this.authApi.authHeaders(),
    });
  }
}
