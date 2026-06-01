import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { apiUrl } from './api-url';
import { AuthApi } from './auth-api';

export type MusicSource = 'deezer' | 'jamendo';

export interface Track {
  id: string;
  source?: MusicSource;
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  audioUrl: string;
  duration: number;
  shareUrl: string;
  licenseUrl: string | null;
  releaseDate: string | null;
  tags: string[];
}

export interface TrackSearchResponse {
  query: string | null;
  mood: string | null;
  count: number;
  fetchedAt: string;
  tracks: Track[];
}

export interface TrackSearchCriteria {
  query?: string;
  mood?: string;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MusicApi {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApi);
  private readonly apiUrl = apiUrl('tracks');

  findTracks(criteria: TrackSearchCriteria): Observable<TrackSearchResponse> {
    let params = new HttpParams().set('limit', criteria.limit ?? 24);

    const query = criteria.query?.trim();
    if (query) {
      params = params.set('q', query);
    }

    const mood = criteria.mood?.trim();
    if (mood && mood !== 'all') {
      params = params.set('mood', mood);
    }

    return this.http.get<TrackSearchResponse>(this.apiUrl, {
      params,
      headers: this.authApi.authHeaders(),
    });
  }

  getTrack(source: MusicSource, trackId: string): Observable<Track> {
    return this.http.get<Track>(`${this.apiUrl}/${encodeURIComponent(source)}/${encodeURIComponent(trackId)}`, {
      headers: this.authApi.authHeaders(),
    });
  }
}
