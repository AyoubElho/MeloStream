package com.musicstream.music.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record TrackDto(
        @NotBlank String id,
        @NotBlank String source,
        @NotBlank String title,
        @NotBlank String artist,
        String album,
        String imageUrl,
        @NotBlank String audioUrl,
        Integer duration,
        String shareUrl,
        String licenseUrl,
        String releaseDate,
        List<String> tags
) {
}
