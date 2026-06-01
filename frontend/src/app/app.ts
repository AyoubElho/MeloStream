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
protected createPlaylist(): void {
    const name = this.newPlaylistName.trim();
    if (!name) {
      this.playlistError.set('Nom de playlist requis.');
      this.playlistMessage.set(null);
      return;
    }

    this.isPlaylistSaving.set(true);
    this.playlistError.set(null);
    this.playlistMessage.set(null);

    this.playlistApi.create(name).pipe(finalize(() => this.isPlaylistSaving.set(false))).subscribe({
      next: (playlist) => {
        this.playlists.set([playlist, ...this.playlists()]);
        this.selectedPlaylistId.set(playlist.id);
        this.newPlaylistName = '';
        this.playlistMessage.set(`Playlist "${playlist.name}" creee.`);
      },
      error: () => {
        this.playlistError.set('Impossible de creer cette playlist.');
      },
    });
  }

  protected selectPlaylist(playlist: Playlist): void {
    this.selectedPlaylistId.set(playlist.id);
    this.editingPlaylistId.set(null);
    this.playlistError.set(null);
    this.playlistMessage.set(null);
  }

  protected beginRenamePlaylist(playlist: Playlist): void {
    this.editingPlaylistId.set(playlist.id);
    this.renamePlaylistName = playlist.name;
    this.playlistError.set(null);
    this.playlistMessage.set(null);
  }

  protected cancelRenamePlaylist(): void {
    this.editingPlaylistId.set(null);
    this.renamePlaylistName = '';
  }

  protected savePlaylistName(playlist: Playlist): void {
    const name = this.renamePlaylistName.trim();
    if (!name) {
      this.playlistError.set('Nom de playlist requis.');
      return;
    }

    this.isPlaylistSaving.set(true);
    this.playlistError.set(null);
    this.playlistMessage.set(null);

    this.playlistApi.rename(playlist.id, name).pipe(finalize(() => this.isPlaylistSaving.set(false))).subscribe({
      next: (updatedPlaylist) => {
        this.replacePlaylist(updatedPlaylist);
        this.editingPlaylistId.set(null);
        this.renamePlaylistName = '';
        this.playlistMessage.set('Playlist renommee.');
      },
      error: () => {
        this.playlistError.set('Impossible de renommer cette playlist.');
      },
    });
  }

  protected deletePlaylist(playlist: Playlist): void {
    this.isPlaylistSaving.set(true);
    this.playlistError.set(null);
    this.playlistMessage.set(null);

    this.playlistApi.delete(playlist.id).pipe(finalize(() => this.isPlaylistSaving.set(false))).subscribe({
      next: () => {
        const nextPlaylists = this.playlists().filter((item) => item.id !== playlist.id);
        this.playlists.set(nextPlaylists);
        this.selectedPlaylistId.set(nextPlaylists[0]?.id ?? null);
        this.playlistMessage.set('Playlist supprimee.');
      },
      error: () => {
        this.playlistError.set('Impossible de supprimer cette playlist.');
      },
    });
  }

   private replacePlaylist(playlist: Playlist): void {
    const playlists = this.playlists();
    if (playlists.some((item) => item.id === playlist.id)) {
      this.playlists.set(playlists.map((item) => item.id === playlist.id ? playlist : item));
      return;
    }
    this.playlists.set([playlist, ...playlists]);
  }


   protected searchTracks(): void {
    this.activeView.set('discover');
    this.loadTracks();
  }

  protected chooseMood(mood: string): void {
    this.activeView.set('discover');
    this.selectedMood.set(mood);
    this.query = '';
    this.loadTracks();
  }

  private loadTracks(): void {
    if (!this.user()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.musicApi
      .findTracks({
        query: this.query,
        mood: this.selectedMood(),
        limit: 24,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const sharedSong = this.sharedSongFromUrl();
          const currentTrack = this.currentTrack();
          this.tracks.set(
            sharedSong && currentTrack ? this.withTrackAtFront(response.tracks, currentTrack) : response.tracks,
          );
        },
        error: () => {
          this.tracks.set([]);
          this.errorMessage.set('Impossible de charger la musique pour le moment.');
        },
      });
  }

   protected resultTitle(): string {
    const cleanQuery = this.query.trim();
    if (cleanQuery) {
      return `Recherche: ${cleanQuery}`;
    }
    return this.moods.find((mood) => mood.value === this.selectedMood())?.label ?? 'Catalogue';
  }
protected toggleFavorite(track: Track): void {
    if (!this.user()) {
      this.authError.set('Connecte-toi pour sauvegarder des titres.');
      return;
    }

    if (this.isFavorite(track)) {
      this.favoriteApi.remove(track.id).subscribe({
        next: () => {
          const nextIds = new Set(this.favoriteIds());
          nextIds.delete(track.id);
          this.favoriteIds.set(nextIds);
          this.savedTracks.set(this.savedTracks().filter((savedTrack) => savedTrack.id !== track.id));
        },
      });
      return;
    }

    this.favoriteApi.add(track).subscribe({
      next: () => {
        this.favoriteIds.set(new Set([...this.favoriteIds(), track.id]));
        this.savedTracks.set([track, ...this.savedTracks()]);
      },
    });
  }
  protected isFavorite(track: Track): boolean {
    return this.favoriteIds().has(track.id);
  }

  private loadFavorites(): void {
    this.favoriteApi.list().subscribe({
      next: (tracks) => {
        this.savedTracks.set(tracks);
        this.favoriteIds.set(new Set(tracks.map((track) => track.id)));
      },
      error: () => {
        this.savedTracks.set([]);
        this.favoriteIds.set(new Set());
      },
    });
  }
}
