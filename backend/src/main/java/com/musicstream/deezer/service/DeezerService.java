package com.musicstream.deezer.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import com.musicstream.deezer.config.DeezerProperties;
import com.musicstream.deezer.mapper.DeezerTrackMapper;
import com.musicstream.music.dto.TrackDto;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriBuilder;

@Service
public class DeezerService {

    private static final int DEFAULT_LIMIT = 18;
    private static final int MAX_LIMIT = 50;
    private static final ParameterizedTypeReference<Map<String, Object>> RESPONSE_TYPE =
            new ParameterizedTypeReference<>() {
            };

    private final RestClient restClient;
    private final DeezerTrackMapper trackMapper;

    public DeezerService(DeezerProperties properties, DeezerTrackMapper trackMapper) {
        this.restClient = RestClient.builder().baseUrl(properties.baseUrl()).build();
        this.trackMapper = trackMapper;
    }

    public List<TrackDto> findTracks(String query, String mood, Integer limit) {
        int resolvedLimit = resolveLimit(limit);
        String normalizedQuery = normalize(query);
        String normalizedMood = normalize(mood);

        try {
            Map<String, Object> response = restClient.get()
                    .uri(uriBuilder -> buildSearchUri(uriBuilder, normalizedQuery, normalizedMood, resolvedLimit))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, clientResponse) -> {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                "Deezer a refuse la requete de recherche musicale"
                        );
                    })
                    .body(RESPONSE_TYPE);

            return trackMapper.toTracks(response, normalizedQuery, normalizedMood);
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Impossible de contacter Deezer: " + exception.getStatusText(),
                    exception
            );
        }
    }

    public Optional<TrackDto> findTrackById(String trackId) {
        if (!StringUtils.hasText(trackId)) {
            return Optional.empty();
        }

        try {
            Map<String, Object> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/track/{trackId}").build(trackId.trim()))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, clientResponse) -> {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                "Deezer a refuse la requete de partage"
                        );
                    })
                    .body(RESPONSE_TYPE);

            return Optional.ofNullable(trackMapper.toSharedTrack(response));
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Impossible de contacter Deezer: " + exception.getStatusText(),
                    exception
            );
        }
    }

    private java.net.URI buildSearchUri(UriBuilder uriBuilder, String query, String mood, int limit) {
        if (!StringUtils.hasText(query) && (!StringUtils.hasText(mood) || "all".equalsIgnoreCase(mood))) {
            return uriBuilder.path("/chart/0/tracks")
                    .queryParam("limit", limit)
                    .build();
        }

        return uriBuilder.path("/search")
                .queryParam("q", StringUtils.hasText(query) ? query : moodToSearchTerm(mood))
                .queryParam("limit", limit)
                .build();
    }

    private int resolveLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        return Math.max(1, Math.min(limit, MAX_LIMIT));
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
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
