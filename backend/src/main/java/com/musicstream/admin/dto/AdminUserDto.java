package com.musicstream.admin.dto;

import java.time.Instant;

public record AdminUserDto(
        Long id,
        String username,
        String name,
        String email,
        String displayName,
        String role,
        Instant createdAt
) {
}
