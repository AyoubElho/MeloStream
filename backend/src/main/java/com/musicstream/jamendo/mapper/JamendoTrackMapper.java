package com.musicstream.jamendo.mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.musicstream.music.dto.TrackDto;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class JamendoTrackMapper {

    public List<TrackDto> toTracks(Map<String, Object> response, String query, String mood) {
        if (response == null || !(response.get("results") instanceof List<?> results)) {
            return List.of();
        }

        List<TrackDto> tracks = new ArrayList<>();
        for (Object item : results) {
            Map<String, Object> track = asMap(item);
            TrackDto trackDto = toTrack(track, tagsFor(query, mood));
            if (trackDto != null) {
                tracks.add(trackDto);
            }
        }

        return tracks;
    }

    public List<TrackDto> toSharedTracks(Map<String, Object> response) {
        if (response == null || !(response.get("results") instanceof List<?> results)) {
            return List.of();
        }

        List<TrackDto> tracks = new ArrayList<>();
        for (Object item : results) {
            TrackDto trackDto = toTrack(asMap(item), List.of("jamendo", "full-track", "shared"));
            if (trackDto != null) {
                tracks.add(trackDto);
            }
        }
        return tracks;
    }

    private TrackDto toTrack(Map<String, Object> track, List<String> tags) {
        String audioUrl = stringValue(track.get("audio"));
        if (!StringUtils.hasText(audioUrl)) {
            return null;
        }

        return new TrackDto(
                stringValue(track.get("id")),
                "jamendo",
                stringValue(track.get("name")),
                stringValue(track.get("artist_name")),
                stringValue(track.get("album_name")),
                firstText(track, "image", "album_image"),
                audioUrl,
                integerValue(track.get("duration")),
                stringValue(track.get("shareurl")),
                stringValue(track.get("license_ccurl")),
                stringValue(track.get("releasedate")),
                tags
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> rawMap) {
            Map<String, Object> map = new LinkedHashMap<>();
            rawMap.forEach((key, item) -> map.put(String.valueOf(key), item));
            return map;
        }
        return Map.of();
    }

    private String firstText(Map<String, Object> source, String... keys) {
        for (String key : keys) {
            String value = stringValue(source.get(key));
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private Integer integerValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private List<String> tagsFor(String query, String mood) {
        if (StringUtils.hasText(query)) {
            return List.of("jamendo", "full-track", "search");
        }
        if (StringUtils.hasText(mood) && !"all".equalsIgnoreCase(mood)) {
            return List.of("jamendo", "full-track", mood);
        }
        return List.of("jamendo", "full-track", "featured");
    }
}
