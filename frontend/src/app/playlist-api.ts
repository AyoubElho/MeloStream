import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { apiUrl } from './api-url';
import { AuthApi } from './auth-api';
import { MusicSource, Track } from './music-api';

export interface Playlist {
  id: number;
  name: string;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
}

@Injectable({ providedIn: 'root' })
export class PlaylistApi {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApi);
  private readonly apiUrl = apiUrl('playlists');

  list(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(this.apiUrl, { headers: this.authApi.authHeaders() });
  }

  create(name: string): Observable<Playlist> {
    return this.http.post<Playlist>(this.apiUrl, { name }, { headers: this.authApi.authHeaders() });
  }
}
