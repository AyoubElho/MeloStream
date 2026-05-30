package com.musicstream.auth.dao;

import java.util.Optional;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.auth.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(UserRole role);
}
