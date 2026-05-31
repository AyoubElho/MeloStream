package com.musicstream.favorites.service;

import java.util.List;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.favorites.dao.FavoriteTrackRepository;
import com.musicstream.favorites.mapper.FavoriteTrackMapper;
import com.musicstream.music.dto.TrackDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

    private final FavoriteTrackRepository favoriteRepository;
    private final FavoriteTrackMapper favoriteTrackMapper;

    public FavoriteService(
            FavoriteTrackRepository favoriteRepository,
            FavoriteTrackMapper favoriteTrackMapper
    ) {
        this.favoriteRepository = favoriteRepository;
        this.favoriteTrackMapper = favoriteTrackMapper;
    }

    @Transactional(readOnly = true)
    public List<TrackDto> list(UserAccount user) {
        return favoriteRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(favoriteTrackMapper::toDto)
                .toList();
    }

    @Transactional
    public TrackDto add(UserAccount user, TrackDto track) {
        if (!favoriteRepository.existsByUserAndTrackId(user, track.id())) {
            favoriteRepository.save(favoriteTrackMapper.toEntity(user, track));
        }
        return track;
    }

    @Transactional
    public void remove(UserAccount user, String trackId) {
        favoriteRepository.deleteByUserAndTrackId(user, trackId);
    }
}
