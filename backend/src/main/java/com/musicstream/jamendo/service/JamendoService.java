package com.musicstream.jamendo.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import com.musicstream.jamendo.config.JamendoProperties;
import com.musicstream.jamendo.mapper.JamendoTrackMapper;
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
public class JamendoService {

    private static final int DEFAULT_LIMIT = 18;
    private static final int MAX_LIMIT = 50;
    private static final ParameterizedTypeReference<Map<String, Object>> RESPONSE_TYPE =
            new ParameterizedTypeReference<>() {
            };

    private final JamendoProperties properties;
    private final RestClient restClient;
    private final JamendoTrackMapper trackMapper;

    public JamendoService(JamendoProperties properties, JamendoTrackMapper trackMapper) {
        this.properties = properties;
        this.restClient = RestClient.builder().baseUrl(properties.baseUrl()).build();
        this.trackMapper = trackMapper;
    }

    public boolean isAvailable() {
        return properties.hasClientId();
    }

    public List<TrackDto> findTracks(String query, String mood, Integer limit) {
        int resolvedLimit = resolveLimit(limit);
        String normalizedQuery = normalize(query);
        String normalizedMood = normalize(mood);

        try {
            Map<String, Object> response = restClient.get()
                    .uri(uriBuilder -> buildTracksUri(uriBuilder, normalizedQuery, normalizedMood, resolvedLimit))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, clientResponse) -> {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                "Jamendo a refuse la requete de recherche musicale"
                        );
                    })
                    .body(RESPONSE_TYPE);

            return trackMapper.toTracks(response, normalizedQuery, normalizedMood);
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Impossible de contacter Jamendo: " + exception.getStatusText(),
                    exception
            );
        }
    }

    public Optional<TrackDto> findTrackById(String trackId) {
        if (!StringUtils.hasText(trackId) || !isAvailable()) {
            return Optional.empty();
        }

        try {
            Map<String, Object> response = restClient.get()
                    .uri(uriBuilder -> buildTrackByIdUri(uriBuilder, trackId.trim()))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, clientResponse) -> {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                "Jamendo a refuse la requete de partage"
                        );
                    })
                    .body(RESPONSE_TYPE);

            return trackMapper.toSharedTracks(response).stream().findFirst();
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    exception.getStatusCode(),
                    "Impossible de contacter Jamendo: " + exception.getStatusText(),
                    exception
            );
        }
    }

    private java.net.URI buildTracksUri(UriBuilder uriBuilder, String query, String mood, int limit) {
        UriBuilder builder = uriBuilder.path("/tracks/")
                .queryParam("client_id", properties.clientId())
                .queryParam("format", "json")
                .queryParam("limit", limit)
                .queryParam("audioformat", "mp32")
                .queryParam("imagesize", "600")
                .queryParam("include", "licenses")
                .queryParam("type", "single", "albumtrack");

        if (StringUtils.hasText(query)) {
            return builder
                    .queryParam("search", query)
                    .queryParam("order", "relevance")
                    .build();
        }

        if (StringUtils.hasText(mood) && !"all".equalsIgnoreCase(mood)) {
            return builder
                    .queryParam("fuzzytags", moodToTag(mood))
                    .queryParam("boost", "popularity_month")
                    .queryParam("groupby", "artist_id")
                    .build();
        }

        return builder
                .queryParam("featured", "1")
                .queryParam("order", "popularity_total")
                .queryParam("groupby", "artist_id")
                .build();
    }

    private java.net.URI buildTrackByIdUri(UriBuilder uriBuilder, String trackId) {
        return uriBuilder.path("/tracks/")
                .queryParam("client_id", properties.clientId())
                .queryParam("format", "json")
                .queryParam("limit", 1)
                .queryParam("id", trackId)
                .queryParam("audioformat", "mp32")
                .queryParam("imagesize", "600")
                .queryParam("include", "licenses")
                .queryParam("type", "single", "albumtrack")
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

    private String moodToTag(String mood) {
        return switch (mood.toLowerCase(Locale.ROOT)) {
            case "electronic" -> "electronic";
            case "relaxation" -> "relaxation";
            case "hiphop" -> "hiphop";
            case "world" -> "world";
            default -> mood;
        };
    }
}
