import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { apiUrl } from './api-url';
import { AuthApi } from './auth-api';

export type UserRole = 'USER' | 'ADMIN';

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalFavorites: number;
  totalPlaylists: number;
  activeSessions: number;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApi);
  private readonly apiUrl = apiUrl('admin');

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`, { headers: this.authApi.authHeaders() });
  }

  users(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`, { headers: this.authApi.authHeaders() });
  }

  updateRole(userId: number, role: UserRole): Observable<AdminUser> {
    return this.http.put<AdminUser>(
      `${this.apiUrl}/users/${userId}/role`,
      { role },
      { headers: this.authApi.authHeaders() },
    );
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`, {
      headers: this.authApi.authHeaders(),
    });
  }
}
