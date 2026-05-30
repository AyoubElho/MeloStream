package com.musicstream.auth.dto;

import java.time.Instant;

public record UserDto(
        Long id,
        String username,
        String name,
        String email,
        String displayName,
        String role,
        String avatarUrl,
        Instant createdAt
) {
}
