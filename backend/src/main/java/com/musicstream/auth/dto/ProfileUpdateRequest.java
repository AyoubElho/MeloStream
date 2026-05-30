package com.musicstream.auth.dto;

import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @Size(max = 120)
        String displayName,

        @Size(max = 1000)
        String avatarUrl,

        @Size(max = 120)
        String password
) {
}
