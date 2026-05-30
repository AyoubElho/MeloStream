package com.musicstream.playlists.dto;

import java.time.Instant;
import java.util.List;

import com.musicstream.music.dto.TrackDto;

public record PlaylistDto(
        Long id,
        String name,
        int trackCount,
        Instant createdAt,
        Instant updatedAt,
        List<TrackDto> tracks
) {
}
