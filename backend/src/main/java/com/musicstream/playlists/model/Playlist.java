package com.musicstream.playlists.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.musicstream.auth.model.UserAccount;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "playlists",
        uniqueConstraints = @UniqueConstraint(name = "uk_playlist_user_name", columnNames = {"user_id", "name"})
)
public class Playlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 120)
    private String name;

    @OneToMany(mappedBy = "playlist", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<PlaylistTrack> tracks = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Playlist() {
    }

    public Playlist(UserAccount user, String name) {
        this.user = user;
        this.name = name;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    public Long getId() {
        return id;
    }

    public UserAccount getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public List<PlaylistTrack> getTracks() {
        return tracks;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void rename(String name) {
        this.name = name;
        touch();
    }

    public void addTrack(PlaylistTrack track) {
        tracks.add(track);
        touch();
    }

    public void removeTrack(String source, String trackId) {
        tracks.removeIf(track -> track.getSource().equals(source) && track.getTrackId().equals(trackId));
        touch();
    }

    public void touch() {
        updatedAt = Instant.now();
    }
}
