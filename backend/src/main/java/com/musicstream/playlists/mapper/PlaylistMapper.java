package com.musicstream.playlists.mapper;

import java.util.List;

import com.musicstream.music.dto.TrackDto;
import com.musicstream.playlists.dto.PlaylistDto;
import com.musicstream.playlists.model.Playlist;
import com.musicstream.playlists.model.PlaylistTrack;
import org.springframework.stereotype.Component;

@Component
public class PlaylistMapper {

    public PlaylistDto toDto(Playlist playlist) {
        List<TrackDto> tracks = playlist.getTracks().stream()
                .map(this::toTrackDto)
                .toList();

        return new PlaylistDto(
                playlist.getId(),
                playlist.getName(),
                tracks.size(),
                playlist.getCreatedAt(),
                playlist.getUpdatedAt(),
                tracks
        );
    }

    public TrackDto toTrackDto(PlaylistTrack track) {
        return new TrackDto(
                track.getTrackId(),
                track.getSource(),
                track.getTitle(),
                track.getArtist(),
                track.getAlbum(),
                track.getImageUrl(),
                track.getAudioUrl(),
                track.getDuration(),
                track.getShareUrl(),
                null,
                null,
                List.of("playlist")
        );
    }

    public PlaylistTrack toEntity(Playlist playlist, TrackDto track, String source) {
        return new PlaylistTrack(
                playlist,
                source,
                track.id(),
                track.title(),
                track.artist(),
                track.album(),
                track.imageUrl(),
                track.audioUrl(),
                track.duration(),
                track.shareUrl()
        );
    }
}
