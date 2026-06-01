package com.musicstream.deezer.mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.musicstream.music.dto.TrackDto;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class DeezerTrackMapper {

    public List<TrackDto> toTracks(Map<String, Object> response, String query, String mood) {
        if (response == null || !(response.get("data") instanceof List<?> data)) {
            return List.of();
        }

        List<TrackDto> tracks = new ArrayList<>();
        for (Object item : data) {
            Map<String, Object> track = asMap(item);
            if (track.isEmpty()) {
                continue;
            }

            TrackDto trackDto = toTrack(track, tagsFor(query, mood));
            if (trackDto != null) {
                tracks.add(trackDto);
            }
        }

        return tracks;
    }

    public TrackDto toSharedTrack(Map<String, Object> track) {
        return toTrack(track, List.of("shared"));
    }

    private TrackDto toTrack(Map<String, Object> track, List<String> tags) {
        String previewUrl = stringValue(track.get("preview"));
        if (!StringUtils.hasText(previewUrl)) {
            return null;
        }

        Map<String, Object> artist = asMap(track.get("artist"));
        Map<String, Object> album = asMap(track.get("album"));
        return new TrackDto(
                stringValue(track.get("id")),
                "deezer",
                stringValue(track.get("title")),
                stringValue(artist.get("name")),
                stringValue(album.get("title")),
                firstText(album, "cover_xl", "cover_big", "cover_medium", "cover"),
                previewUrl,
                integerValue(track.get("duration")),
                stringValue(track.get("link")),
                null,
                null,
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
            return List.of("search");
        }
        if (StringUtils.hasText(mood) && !"all".equalsIgnoreCase(mood)) {
            return List.of(moodToSearchTerm(mood));
        }
        return List.of("popular");
    }

    private String moodToSearchTerm(String mood) {
        if (!StringUtils.hasText(mood)) {
            return "top hits";
        }

        return switch (mood.toLowerCase(Locale.ROOT)) {
            case "electronic" -> "electronic dance";
            case "relaxation" -> "chill acoustic";
            case "hiphop" -> "hip hop";
            case "world" -> "world music";
            default -> mood;
        };
    }
}
