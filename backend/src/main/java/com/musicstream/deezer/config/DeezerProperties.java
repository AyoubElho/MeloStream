package com.musicstream.deezer.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "deezer")
public record DeezerProperties(String baseUrl) {
}
