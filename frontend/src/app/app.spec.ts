import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { App } from './app';
import { AuthApi } from './auth-api';
import { FavoriteApi } from './favorite-api';
import { MusicApi, Track } from './music-api';
import { PlaylistApi } from './playlist-api';

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
  let requestedTrackLookup: { source: string; trackId: string } | null = null;

  beforeEach(async () => {
    window.history.pushState({}, '', '/');
    loginResponse = { token: 'token', expiresAt: '2026-05-30T00:00:00Z', user };
    trackResponse = { query: null, mood: null, count: 0, fetchedAt: '', tracks: [] };
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
              return of(track);
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
});
