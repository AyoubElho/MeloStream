package com.musicstream.music.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

import com.musicstream.deezer.service.DeezerService;
import com.musicstream.jamendo.service.JamendoService;
import com.musicstream.music.dto.TrackDto;
import com.musicstream.music.dto.TrackSearchResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MusicService {

    private final DeezerService deezerService;
    private final JamendoService jamendoService;

    public MusicService(DeezerService deezerService, JamendoService jamendoService) {
        this.deezerService = deezerService;
        this.jamendoService = jamendoService;
    }

    public TrackSearchResponse searchTracks(String query, String mood, Integer limit) {
        List<TrackDto> tracks = jamendoService.isAvailable()
                ? jamendoService.findTracks(query, mood, limit)
                : deezerService.findTracks(query, mood, limit);
        return new TrackSearchResponse(query, mood, tracks.size(), Instant.now(), tracks);
    }

    public TrackDto findTrack(String source, String trackId) {
        if (!StringUtils.hasText(source) || !StringUtils.hasText(trackId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lien de partage invalide");
        }

        return switch (source.trim().toLowerCase(Locale.ROOT)) {
            case "undefined" -> deezerService.findTrackById(trackId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Titre Deezer introuvable"));
            case "deezer" -> deezerService.findTrackById(trackId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Titre Deezer introuvable"));
            case "jamendo" -> jamendoService.findTrackById(trackId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Titre Jamendo introuvable"));
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Source musicale inconnue");
        };
    }
}
