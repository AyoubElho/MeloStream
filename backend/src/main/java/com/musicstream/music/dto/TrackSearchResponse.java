package com.musicstream.music.dto;

import java.time.Instant;
import java.util.List;

public record TrackSearchResponse(
        String query,
        String mood,
        int count,
        Instant fetchedAt,
        List<TrackDto> tracks
) {
}
