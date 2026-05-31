package com.musicstream.favorites.mapper;

import java.util.List;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.favorites.model.FavoriteTrack;
import com.musicstream.music.dto.TrackDto;
import org.springframework.stereotype.Component;

@Component
public class FavoriteTrackMapper {

    public TrackDto toDto(FavoriteTrack favoriteTrack) {
        return new TrackDto(
                favoriteTrack.getTrackId(),
                sourceFor(favoriteTrack),
                favoriteTrack.getTitle(),
                favoriteTrack.getArtist(),
                favoriteTrack.getAlbum(),
                favoriteTrack.getImageUrl(),
                favoriteTrack.getAudioUrl(),
                favoriteTrack.getDuration(),
                favoriteTrack.getShareUrl(),
                null,
                null,
                List.of("saved")
        );
    }

    public FavoriteTrack toEntity(UserAccount user, TrackDto track) {
        return new FavoriteTrack(
                user,
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

    private String sourceFor(FavoriteTrack favoriteTrack) {
        String shareUrl = favoriteTrack.getShareUrl();
        if (shareUrl != null && shareUrl.toLowerCase().contains("jamendo")) {
            return "jamendo";
        }
        return "deezer";
    }
}
