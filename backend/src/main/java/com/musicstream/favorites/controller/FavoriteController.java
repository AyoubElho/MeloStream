package com.musicstream.favorites.controller;

import java.util.List;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.favorites.service.FavoriteService;
import com.musicstream.music.dto.TrackDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<TrackDto> list(@AuthenticationPrincipal UserAccount user) {
        return favoriteService.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrackDto add(
            @AuthenticationPrincipal UserAccount user,
            @Valid @RequestBody TrackDto track
    ) {
        return favoriteService.add(user, track);
    }

    @DeleteMapping("/{trackId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @AuthenticationPrincipal UserAccount user,
            @PathVariable String trackId
    ) {
        favoriteService.remove(user, trackId);
    }
}
