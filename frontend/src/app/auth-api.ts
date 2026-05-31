import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable, of, tap } from 'rxjs';

import { apiUrl } from './api-url';

export interface CurrentUser {
  id: number;
  username: string;
  email: string | null;
  displayName: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: CurrentUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  username: string;
}

export interface ProfileUpdatePayload {
  displayName: string;
  avatarUrl: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly tokenStorageKey = 'melostream.authToken';
  private readonly apiUrl = apiUrl('auth');

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => this.storeToken(response.token)),
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((response) => this.storeToken(response.token)),
    );
  }

  me(): Observable<CurrentUser | null> {
    const token = this.token();
    if (!token) {
      return of(null);
    }
    return this.http.get<CurrentUser>(`${this.apiUrl}/me`, { headers: this.authHeaders() });
  }

  updateProfile(payload: ProfileUpdatePayload): Observable<CurrentUser> {
    return this.http.put<CurrentUser>(`${this.apiUrl}/profile`, payload, {
      headers: this.authHeaders(),
    });
  }

  logout(): Observable<void> {
    const token = this.token();
    if (!token) {
      this.clearToken();
      return of(undefined);
    }

    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { headers: this.authHeaders() }).pipe(
      tap(() => this.clearToken()),
    );
  }

  token(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  authHeaders(): HttpHeaders {
    const token = this.token();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }
}
