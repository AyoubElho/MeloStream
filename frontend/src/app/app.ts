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

  protected openPlaylistPicker(track: Track): void {
    this.playlistTarget.set(track);
    this.playlistError.set(null);
    this.playlistMessage.set(null);
    if (this.playlists().length === 0) {
      this.loadPlaylists();
    }
  }

    protected closePlaylistPicker(): void {
    this.playlistTarget.set(null);
  }

  protected createPlaylistForTrack(track: Track): void {
    const name = this.newPlaylistName.trim();
    if (!name) {
      this.playlistError.set('Nom de playlist requis.');
      return;
    }

    this.isPlaylistSaving.set(true);
    this.playlistError.set(null);
    this.playlistMessage.set(null);

    this.playlistApi.create(name).subscribe({
      next: (playlist) => {
        this.playlists.set([playlist, ...this.playlists()]);
        this.selectedPlaylistId.set(playlist.id);
        this.newPlaylistName = '';
        this.addTrackToPlaylist(track, playlist, true);
      },
      error: () => {
        this.isPlaylistSaving.set(false);
        this.playlistError.set('Impossible de creer cette playlist.');
      },
    });
  }

  protected addTrackToPlaylist(track: Track, playlist: Playlist, keepSaving = false): void {
    this.isPlaylistSaving.set(true);
    this.playlistError.set(null);
    this.playlistMessage.set(null);

    this.playlistApi.addTrack(playlist.id, track)
      .pipe(finalize(() => {
        if (!keepSaving) {
          this.isPlaylistSaving.set(false);
        }
      }))
      .subscribe({
        next: (updatedPlaylist) => {
          this.replacePlaylist(updatedPlaylist);
          this.selectedPlaylistId.set(updatedPlaylist.id);
          this.playlistTarget.set(null);
          this.activeView.set('playlists');
          this.playlistMessage.set(`"${track.title}" ajoute a "${updatedPlaylist.name}".`);
          if (keepSaving) {
            this.isPlaylistSaving.set(false);
          }
        },
        error: () => {
          this.playlistError.set("Impossible d'ajouter ce titre a la playlist.");
          if (keepSaving) {
            this.isPlaylistSaving.set(false);
          }
        },
      });
  }

  protected removeTrackFromPlaylist(playlist: Playlist, track: Track): void {
    this.isPlaylistSaving.set(true);
    this.playlistError.set(null);
    this.playlistMessage.set(null);

    this.playlistApi.removeTrack(playlist.id, this.musicSource(track), track.id)
      .pipe(finalize(() => this.isPlaylistSaving.set(false)))
      .subscribe({
        next: (updatedPlaylist) => {
          this.replacePlaylist(updatedPlaylist);
          this.playlistMessage.set('Titre retire de la playlist.');
        },
        error: () => {
          this.playlistError.set('Impossible de retirer ce titre.');
        },
      });
  }

  protected isTrackInPlaylist(track: Track, playlist: Playlist): boolean {
    const source = this.musicSource(track);
    return playlist.tracks.some((item) => this.musicSource(item) === source && item.id === track.id);
  }

   protected playTrack(track: Track): void {
    this.shouldAutoplay.set(true);
    this.currentTrack.set(track);
  }

  protected async shareTrack(track: Track): Promise<void> {
    this.shareMessage.set(null);
    this.shareError.set(null);

    const shareUrl = this.shareUrl(track);
    const title = `${track.title} - ${track.artist}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Ecoute ${title} sur MeloStream.`,
          url: shareUrl,
        });
        this.shareMessage.set('Lien de partage pret.');
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      this.shareMessage.set('Lien de partage copie.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.shareError.set(`Copie impossible. Lien: ${shareUrl}`);
    }
  }

  private shareUrl(track: Track): string {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('song', `${this.musicSource(track)}:${track.id}`);
    return url.toString();
  }

  private sharedSongFromUrl(): { source: MusicSource; trackId: string } | null {
    const token = new URLSearchParams(window.location.search).get('song');
    if (!token) {
      return null;
    }

    const separatorIndex = token.indexOf(':');
    if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
      return null;
    }

    const source = this.normalizeMusicSource(token.slice(0, separatorIndex));
    const trackId = token.slice(separatorIndex + 1);
    if (!source) {
      return null;
    }
    return { source, trackId };
  }

   private loadSharedTrackFromUrl(): void {
    const sharedSong = this.sharedSongFromUrl();
    if (!sharedSong) {
      return;
    }

    this.activeView.set('discover');
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.musicApi
      .getTrack(sharedSong.source, sharedSong.trackId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (track) => {
          this.shouldAutoplay.set(false);
          this.currentTrack.set(track);
          this.tracks.set(this.withTrackAtFront(this.tracks(), track));
          this.shareMessage.set('Titre partage charge.');
        },
        error: () => {
          this.errorMessage.set('Impossible de charger le titre partage.');
        },
      });
  }

  protected saveSettings(): void {
    const displayName = this.settingsDisplayName.trim();
    if (!displayName) {
      this.settingsError.set('Le nom affiche est requis.');
      this.settingsMessage.set(null);
      return;
    }

    this.isSettingsSaving.set(true);
    this.settingsError.set(null);
    this.settingsMessage.set(null);

    this.authApi
      .updateProfile({
        displayName,
        avatarUrl: this.settingsAvatarUrl.trim(),
        password: this.settingsPassword,
      })
      .pipe(finalize(() => this.isSettingsSaving.set(false)))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.syncSettingsForm(user);
          this.settingsMessage.set('Profil mis a jour.');
        },
        error: () => {
          this.settingsError.set('Impossible de sauvegarder le profil.');
        },
      });
  }
 private syncSettingsForm(user = this.user()): void {
    if (!user) {
      this.settingsDisplayName = '';
      this.settingsAvatarUrl = '';
      this.settingsPassword = '';
      this.settingsError.set(null);
      this.settingsMessage.set(null);
      return;
    }

    this.settingsDisplayName = user.displayName;
    this.settingsAvatarUrl = user.avatarUrl ?? '';
    this.settingsPassword = '';
    this.settingsError.set(null);
  }

  protected profileImage(): string | null {
    const avatarUrl = this.user()?.avatarUrl?.trim();
    return avatarUrl ? avatarUrl : null;
  }

  protected profileInitials(): string {
    const name = this.user()?.displayName || this.user()?.email || this.user()?.username || 'U';
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');

    return initials || 'U';
  }


}
