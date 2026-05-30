package com.musicstream.playlists.controller;

import java.util.List;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.music.dto.TrackDto;
import com.musicstream.playlists.dto.PlaylistDto;
import com.musicstream.playlists.dto.PlaylistRequest;
import com.musicstream.playlists.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping
    public List<PlaylistDto> list(@AuthenticationPrincipal UserAccount user) {
        return playlistService.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaylistDto create(
            @AuthenticationPrincipal UserAccount user,
            @Valid @RequestBody PlaylistRequest request
    ) {
        return playlistService.create(user, request);
    }

    @PutMapping("/{playlistId}")
    public PlaylistDto rename(
            @AuthenticationPrincipal UserAccount user,
            @PathVariable Long playlistId,
            @Valid @RequestBody PlaylistRequest request
    ) {
        return playlistService.rename(user, playlistId, request);
    }

    @DeleteMapping("/{playlistId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserAccount user,
            @PathVariable Long playlistId
    ) {
        playlistService.delete(user, playlistId);
    }

    @PostMapping("/{playlistId}/tracks")
    @ResponseStatus(HttpStatus.CREATED)
    public PlaylistDto addTrack(
            @AuthenticationPrincipal UserAccount user,
            @PathVariable Long playlistId,
            @Valid @RequestBody TrackDto track
    ) {
        return playlistService.addTrack(user, playlistId, track);
    }

    @DeleteMapping("/{playlistId}/tracks/{source}/{trackId}")
    public PlaylistDto removeTrack(
            @AuthenticationPrincipal UserAccount user,
            @PathVariable Long playlistId,
            @PathVariable String source,
            @PathVariable String trackId
    ) {
        return playlistService.removeTrack(user, playlistId, source, trackId);
    }
}
