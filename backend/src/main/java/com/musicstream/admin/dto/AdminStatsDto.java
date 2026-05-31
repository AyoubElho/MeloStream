package com.musicstream.admin.dto;

public record AdminStatsDto(
        long totalUsers,
        long totalAdmins,
        long totalFavorites,
        long totalPlaylists,
        long activeSessions
) {
}
