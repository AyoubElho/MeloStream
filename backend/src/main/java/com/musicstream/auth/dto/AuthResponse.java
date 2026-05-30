package com.musicstream.auth.dto;

import java.time.Instant;

public record AuthResponse(String token, Instant expiresAt, UserDto user) {
}
