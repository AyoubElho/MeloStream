package com.musicstream.favorites.dao;

import java.util.List;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.favorites.model.FavoriteTrack;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteTrackRepository extends JpaRepository<FavoriteTrack, Long> {

    List<FavoriteTrack> findByUserOrderByCreatedAtDesc(UserAccount user);

    boolean existsByUserAndTrackId(UserAccount user, String trackId);

    void deleteByUserAndTrackId(UserAccount user, String trackId);

    void deleteByUser(UserAccount user);
}
