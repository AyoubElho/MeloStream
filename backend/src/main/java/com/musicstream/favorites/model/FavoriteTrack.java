package com.musicstream.favorites.model;

import java.time.Instant;

import com.musicstream.auth.model.UserAccount;
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
        name = "favorite_tracks",
        uniqueConstraints = @UniqueConstraint(name = "uk_favorite_user_track", columnNames = {"user_id", "track_id"})
)
public class FavoriteTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

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

    protected FavoriteTrack() {
    }

    public FavoriteTrack(
            UserAccount user,
            String trackId,
            String title,
            String artist,
            String album,
            String imageUrl,
            String audioUrl,
            Integer duration,
            String shareUrl
    ) {
        this.user = user;
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
