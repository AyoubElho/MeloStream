package com.musicstream.jamendo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "jamendo")
public record JamendoProperties(String baseUrl, String clientId) {

    public JamendoProperties {
        if (!StringUtils.hasText(baseUrl)) {
            baseUrl = "https://api.jamendo.com/v3.0";
        }
    }

    public boolean hasClientId() {
        return StringUtils.hasText(clientId);
    }
}
