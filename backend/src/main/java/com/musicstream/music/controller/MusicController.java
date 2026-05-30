package com.musicstream.music.controller;

import com.musicstream.music.dto.TrackDto;
import com.musicstream.music.dto.TrackSearchResponse;
import com.musicstream.music.service.MusicService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/tracks")
public class MusicController {

    private final MusicService musicService;

    public MusicController(MusicService musicService) {
        this.musicService = musicService;
    }

    @GetMapping
    public TrackSearchResponse searchTracks(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String mood,
            @RequestParam(defaultValue = "18") @Min(1) @Max(50) Integer limit
    ) {
        return musicService.searchTracks(q, mood, limit);
    }

    @GetMapping("/{source}/{trackId}")
    public TrackDto sharedTrack(
            @PathVariable String source,
            @PathVariable String trackId
    ) {
        return musicService.findTrack(source, trackId);
    }
}
