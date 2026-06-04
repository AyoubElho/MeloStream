import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { App } from './app';
import { AuthApi } from './auth-api';
import { FavoriteApi } from './favorite-api';
import { MusicApi, Track } from './music-api';
import { Playlist, PlaylistApi } from './playlist-api';

describe('App', () => {
  const user = {
    id: 1,
    username: 'listener',
    email: 'listener@example.com',
    displayName: 'Listener',
    role: 'USER' as const,
    avatarUrl: null,
    createdAt: '2026-05-29T00:00:00Z',
  };
  const track: Track = {
    id: 'track-1',
    source: 'deezer',
    title: 'Quiet Intro',
    artist: 'MeloStream',
    album: 'No Autoplay',
    imageUrl: 'cover.jpg',
    audioUrl: 'track.mp3',
    duration: 180,
    shareUrl: 'https://example.com/track-1',
    licenseUrl: null,
    releaseDate: null,
    tags: [],
  };
  let loginResponse = { token: 'token', expiresAt: '2026-05-30T00:00:00Z', user };
  let trackResponse = { query: null, mood: null, count: 0, fetchedAt: '', tracks: [] as Track[] };
  let trackLookupResponse = track;
  let requestedTrackLookup: { source: string; trackId: string } | null = null;

  beforeEach(async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    window.history.pushState({}, '', '/');
    loginResponse = { token: 'token', expiresAt: '2026-05-30T00:00:00Z', user };
    trackResponse = { query: null, mood: null, count: 0, fetchedAt: '', tracks: [] };
    trackLookupResponse = track;
    requestedTrackLookup = null;

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: MusicApi,
          useValue: {
            findTracks: () => of(trackResponse),
            getTrack: (source: string, trackId: string) => {
              requestedTrackLookup = { source, trackId };
              return of(trackLookupResponse);
            },
          },
        },
        {
          provide: AuthApi,
          useValue: {
            me: () => of(null),
            login: () => of(loginResponse),
            register: () => of(loginResponse),
            updateProfile: () => of(null),
            logout: () => of(undefined),
            clearToken: () => undefined,
          },
        },
        {
          provide: FavoriteApi,
          useValue: {
            list: () => of([]),
            add: () => of(null),
            remove: () => of(undefined),
          },
        },
        {
          provide: PlaylistApi,
          useValue: {
            list: () => of([]),
            create: () => of(null),
            rename: () => of(null),
            delete: () => of(undefined),
            addTrack: () => of(null),
            removeTrack: () => of(null),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the brand', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('MeloStream');
  });

  it('should wait for an explicit play action after login', async () => {
    trackResponse = { query: null, mood: null, count: 1, fetchedAt: '', tracks: [track] };
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;

    app.email = user.email;
    app.password = 'password';
    app.submitAuth();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(app.currentTrack()).toBeNull();
    expect(compiled.querySelector('.player')).toBeNull();
  });

  it('should load a shared song after login without autoplaying it', async () => {
    window.history.pushState({}, '', '/?song=deezer%3Atrack-1');
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    app.email = user.email;
    app.password = 'password';
    app.submitAuth();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const audio = compiled.querySelector('.player audio') as HTMLAudioElement;
    expect(app.currentTrack()).toEqual(track);
    expect(audio).toBeTruthy();
    expect(audio.autoplay).toBe(false);
  });

  it('should recover old shared links with an undefined source', async () => {
    window.history.pushState({}, '', '/?song=undefined%3A4007788071');
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    app.email = user.email;
    app.password = 'password';
    app.submitAuth();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(requestedTrackLookup).toEqual({ source: 'deezer', trackId: '4007788071' });
  });

  it('should create a Deezer share link when a track source is missing', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    const legacyTrack = { ...track, source: undefined };

    expect(app.shareUrl(legacyTrack)).toContain('?song=deezer%3Atrack-1');
  });

  it('should continue with the next track after playlist playback ends', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    const nextTrack: Track = {
      ...track,
      id: 'track-2',
      title: 'Second Song',
      audioUrl: 'track-2.mp3',
      shareUrl: 'https://example.com/track-2',
    };
    const playlist: Playlist = {
      id: 10,
      name: 'Evening Mix',
      trackCount: 2,
      createdAt: '2026-05-29T00:00:00Z',
      updatedAt: '2026-05-29T00:00:00Z',
      tracks: [track, nextTrack],
    };

    app.playPlaylistTrack(playlist, track);
    expect(app.currentTrack()).toEqual(track);

    app.playNextTrack();
    expect(app.currentTrack()).toEqual(nextTrack);

    app.playNextTrack();
    expect(app.currentTrack()).toEqual(nextTrack);
  });

  it('should retry autoplay when the next playlist track becomes playable', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play');
    playSpy
      .mockRejectedValueOnce(new DOMException('Source is changing', 'AbortError'))
      .mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    const audio = document.createElement('audio');

    app.audioPlayer = { nativeElement: audio };
    app.shouldAutoplay.set(true);
    app.handleAudioCanPlay();
    await Promise.resolve();

    expect(app.shouldAutoplay()).toBe(true);
    app.handleAudioCanPlay();
    expect(playSpy).toHaveBeenCalledTimes(2);
  });

  it('should move backward and forward with player arrows', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    const secondTrack: Track = {
      ...track,
      id: 'track-2',
      title: 'Second Song',
      audioUrl: 'track-2.mp3',
      shareUrl: 'https://example.com/track-2',
    };
    const playlist: Playlist = {
      id: 10,
      name: 'Evening Mix',
      trackCount: 2,
      createdAt: '2026-05-29T00:00:00Z',
      updatedAt: '2026-05-29T00:00:00Z',
      tracks: [track, secondTrack],
    };

    app.playPlaylistTrack(playlist, secondTrack);
    expect(app.hasPreviousTrack()).toBe(true);
    expect(app.hasNextTrack()).toBe(false);

    app.playPreviousTrack();
    expect(app.currentTrack()).toEqual(track);
    expect(app.hasPreviousTrack()).toBe(false);
    expect(app.hasNextTrack()).toBe(true);

    app.playNextTrack();
    expect(app.currentTrack()).toEqual(secondTrack);
  });

  it('should refresh a playlist track when its saved audio URL is missing', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    const staleTrack: Track = { ...track, audioUrl: '' };
    const playlist: Playlist = {
      id: 10,
      name: 'Evening Mix',
      trackCount: 1,
      createdAt: '2026-05-29T00:00:00Z',
      updatedAt: '2026-05-29T00:00:00Z',
      tracks: [staleTrack],
    };

    app.playPlaylistTrack(playlist, staleTrack);

    expect(requestedTrackLookup).toEqual({ source: 'deezer', trackId: 'track-1' });
    expect(app.currentTrack()).toEqual(track);
  });

  it('should skip an unavailable playlist track and continue playback', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    const unavailableTrack: Track = {
      ...track,
      id: 'track-2',
      title: 'Missing Preview',
      audioUrl: '',
      shareUrl: 'https://example.com/track-2',
    };
    const nextTrack: Track = {
      ...track,
      id: 'track-3',
      title: 'Still Playing',
      audioUrl: 'track-3.mp3',
      shareUrl: 'https://example.com/track-3',
    };
    const playlist: Playlist = {
      id: 10,
      name: 'Evening Mix',
      trackCount: 3,
      createdAt: '2026-05-29T00:00:00Z',
      updatedAt: '2026-05-29T00:00:00Z',
      tracks: [track, unavailableTrack, nextTrack],
    };
    trackLookupResponse = unavailableTrack;

    app.playPlaylistTrack(playlist, unavailableTrack);

    expect(requestedTrackLookup).toEqual({ source: 'deezer', trackId: 'track-2' });
    expect(app.currentTrack()).toEqual(nextTrack);
  });
});
