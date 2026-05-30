package com.musicstream.playlists.dao;

import java.util.List;
import java.util.Optional;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.playlists.model.Playlist;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {

    List<Playlist> findByUserOrderByUpdatedAtDesc(UserAccount user);

    Optional<Playlist> findByIdAndUser(Long id, UserAccount user);

    boolean existsByUserAndNameIgnoreCase(UserAccount user, String name);

    void deleteByUser(UserAccount user);
}
