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

  rename(playlistId: number, name: string): Observable<Playlist> {
    return this.http.put<Playlist>(
      `${this.apiUrl}/${playlistId}`,
      { name },
      { headers: this.authApi.authHeaders() },
    );
  }

  delete(playlistId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${playlistId}`, { headers: this.authApi.authHeaders() });
  }

  addTrack(playlistId: number, track: Track): Observable<Playlist> {
    return this.http.post<Playlist>(`${this.apiUrl}/${playlistId}/tracks`, track, {
      headers: this.authApi.authHeaders(),
    });
  }

  removeTrack(playlistId: number, source: MusicSource, trackId: string): Observable<Playlist> {
    return this.http.delete<Playlist>(
      `${this.apiUrl}/${playlistId}/tracks/${encodeURIComponent(source)}/${encodeURIComponent(trackId)}`,
      { headers: this.authApi.authHeaders() },
    );
  }
}
