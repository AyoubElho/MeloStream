package com.musicstream.playlists.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "playlist_tracks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_playlist_source_track",
                columnNames = {"playlist_id", "source", "track_id"}
        )
)
public class PlaylistTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @Column(nullable = false, length = 30)
    private String source;

    @Column(name = "track_id", nullable = false, length = 80)
    private String trackId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String artist;

    private String album;

    @Column(length = 1000)
    private String imageUrl;

    @Column(length = 1200)
    private String audioUrl;

    private Integer duration;

    @Column(length = 1000)
    private String shareUrl;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected PlaylistTrack() {
    }

    public PlaylistTrack(
            Playlist playlist,
            String source,
            String trackId,
            String title,
            String artist,
            String album,
            String imageUrl,
            String audioUrl,
            Integer duration,
            String shareUrl
    ) {
        this.playlist = playlist;
        this.source = source;
        this.trackId = trackId;
        this.title = title;
        this.artist = artist;
        this.album = album;
        this.imageUrl = imageUrl;
        this.audioUrl = audioUrl;
        this.duration = duration;
        this.shareUrl = shareUrl;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public String getSource() {
        return source;
    }

    public String getTrackId() {
        return trackId;
    }

    public String getTitle() {
        return title;
    }

    public String getArtist() {
        return artist;
    }

    public String getAlbum() {
        return album;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public Integer getDuration() {
        return duration;
    }

    public String getShareUrl() {
        return shareUrl;
    }
}
