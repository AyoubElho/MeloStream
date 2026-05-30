package com.musicstream.auth.dao;

import java.time.Instant;
import java.util.Optional;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.auth.model.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {

    Optional<AuthToken> findByToken(String token);

    void deleteByUser(UserAccount user);

    @Modifying
    long deleteByExpiresAtBefore(Instant instant);
}
