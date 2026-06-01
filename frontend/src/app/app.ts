import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideClock,
  LucideHeadphones,
  LucideHeart,
  LucideHouse,
  LucideLibrary,
  LucideListMusic,
  LucideListPlus,
  LucideLogIn,
  LucideLogOut,
  LucidePlay,
  LucidePlus,
  LucideRefreshCw,
  LucideSave,
  LucideSearch,
  LucideSettings,
  LucideShare2,
  LucideShield,
  LucideTrash2,
  LucideUserPlus,
  LucideUsers,
  LucideX,
} from '@lucide/angular';

import { finalize } from 'rxjs';

import { AdminApi, AdminStats, AdminUser, UserRole } from './admin-api';
import { AuthApi, CurrentUser } from './auth-api';
import { FavoriteApi } from './favorite-api';
import { MusicApi, MusicSource, Track } from './music-api';
import { Playlist, PlaylistApi } from './playlist-api';

type DashboardView = 'discover' | 'library' | 'playlists' | 'settings' | 'admin';

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    LucideClock,
    LucideHeadphones,
    LucideHeart,
    LucideHouse,
    LucideLibrary,
    LucideListMusic,
    LucideListPlus,
    LucideLogIn,
    LucideLogOut,
    LucidePlay,
    LucidePlus,
    LucideRefreshCw,
    LucideSave,
    LucideSearch,
    LucideSettings,
    LucideShare2,
    LucideShield,
    LucideTrash2,
    LucideUserPlus,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly authApi = inject(AuthApi);
  private readonly favoriteApi = inject(FavoriteApi);
  private readonly musicApi = inject(MusicApi);
  private readonly playlistApi = inject(PlaylistApi);

  protected query = '';
  protected email = '';
  protected username = '';
  protected password = '';
  protected passwordConfirmation = '';
  protected settingsDisplayName = '';
  protected settingsAvatarUrl = '';
  protected settingsPassword = '';
  protected newPlaylistName = '';
  protected renamePlaylistName = '';

  protected readonly authMode = signal<'login' | 'register'>('login');
  protected readonly user = signal<CurrentUser | null>(null);
  protected readonly activeView = signal<DashboardView>('discover');
  protected readonly selectedMood = signal('all');
  protected readonly isLoading = signal(false);
  protected readonly isAuthLoading = signal(false);
  protected readonly isAdminLoading = signal(false);
  protected readonly isSettingsSaving = signal(false);
  protected readonly isPlaylistSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly adminError = signal<string | null>(null);
  protected readonly adminMessage = signal<string | null>(null);
  protected readonly authError = signal<string | null>(null);
  protected readonly shareMessage = signal<string | null>(null);
  protected readonly shareError = signal<string | null>(null);
  protected readonly playlistMessage = signal<string | null>(null);
  protected readonly playlistError = signal<string | null>(null);
  protected readonly settingsError = signal<string | null>(null);
  protected readonly settingsMessage = signal<string | null>(null);
  protected readonly tracks = signal<Track[]>([]);
  protected readonly savedTracks = signal<Track[]>([]);
  protected readonly playlists = signal<Playlist[]>([]);
  protected readonly adminUsers = signal<AdminUser[]>([]);
  protected readonly adminStats = signal<AdminStats | null>(null);
  protected readonly currentTrack = signal<Track | null>(null);
  protected readonly playlistTarget = signal<Track | null>(null);
  protected readonly selectedPlaylistId = signal<number | null>(null);
  protected readonly editingPlaylistId = signal<number | null>(null);
  protected readonly shouldAutoplay = signal(false);
  protected readonly favoriteIds = signal<Set<string>>(new Set());
  protected readonly updatingRoleIds = signal<Set<number>>(new Set());

  protected readonly moods = [
    { label: 'Top', value: 'all' },
    { label: 'Electronic', value: 'electronic' },
    { label: 'Jazz', value: 'jazz' },
    { label: 'Rock', value: 'rock' },
    { label: 'Relax', value: 'relaxation' },
    { label: 'Hip-hop', value: 'hiphop' },
    { label: 'World', value: 'world' },
  ];

  protected readonly heroTrack = computed(() => this.tracks()[0] ?? this.savedTracks()[0] ?? null);
  protected readonly libraryCount = computed(() => this.savedTracks().length);
  protected readonly playlistCount = computed(() => this.playlists().length);
  protected readonly selectedPlaylist = computed(() => {
    const playlists = this.playlists();
    return playlists.find((playlist) => playlist.id === this.selectedPlaylistId()) ?? playlists[0] ?? null;
  });
  protected readonly catalogTracks = computed(() => this.tracks().slice(1));
  protected readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  ngOnInit(): void {
    this.restoreSession();
  }

  protected submitAuth(): void {
    this.authError.set(null);

    if (this.authMode() === 'register' && this.password !== this.passwordConfirmation) {
      this.authError.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.isAuthLoading.set(true);

    const request = this.authMode() === 'login'
      ? this.authApi.login({ email: this.email, password: this.password })
      : this.authApi.register({
          username: this.username,
          email: this.email,
          password: this.password,
        });

    request.pipe(finalize(() => this.isAuthLoading.set(false))).subscribe({
      next: (response) => {
        this.user.set(response.user);
        this.afterAuthentication();
      },
      error: () => {
        const message = this.authMode() === 'login'
          ? 'Identifiants incorrects.'
          : 'Username ou email deja utilise, ou informations invalides.';
        this.authError.set(message);
      },
    });
  }

  protected switchAuthMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.authError.set(null);
    this.passwordConfirmation = '';
  }

  protected logout(): void {
    this.authApi.logout().subscribe({
      complete: () => {
        this.authApi.clearToken();
        this.user.set(null);
        this.tracks.set([]);
        this.savedTracks.set([]);
        this.playlists.set([]);
        this.favoriteIds.set(new Set());
        this.adminUsers.set([]);
        this.adminStats.set(null);
        this.currentTrack.set(null);
        this.playlistTarget.set(null);
        this.selectedPlaylistId.set(null);
        this.editingPlaylistId.set(null);
        this.shouldAutoplay.set(false);
        this.shareMessage.set(null);
        this.shareError.set(null);
        this.playlistMessage.set(null);
        this.playlistError.set(null);
        this.newPlaylistName = '';
        this.renamePlaylistName = '';
        this.activeView.set('discover');
        this.syncSettingsForm(null);
      },
    });
  }


  private restoreSession(): void {
    this.authApi.me().subscribe({
      next: (user) => {
        this.user.set(user);
        if (user) {
          this.afterAuthentication();
        }
      },
      error: () => {
        this.authApi.clearToken();
        this.user.set(null);
      },
    });
  }

  private afterAuthentication(): void {
    this.syncSettingsForm();
    this.loadFavorites();
    this.loadPlaylists();
    this.loadTracks();
    this.loadSharedTrackFromUrl();
  }

}
