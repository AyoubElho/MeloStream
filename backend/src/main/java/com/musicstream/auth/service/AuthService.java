package com.musicstream.auth.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;

import com.musicstream.auth.dao.AuthTokenRepository;
import com.musicstream.auth.dao.UserAccountRepository;
import com.musicstream.auth.dto.AuthResponse;
import com.musicstream.auth.dto.LoginRequest;
import com.musicstream.auth.dto.ProfileUpdateRequest;
import com.musicstream.auth.dto.RegisterRequest;
import com.musicstream.auth.dto.UserDto;
import com.musicstream.auth.mapper.UserMapper;
import com.musicstream.auth.model.AuthToken;
import com.musicstream.auth.model.UserAccount;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final Duration TOKEN_TTL = Duration.ofDays(7);

    private final SecureRandom secureRandom = new SecureRandom();
    private final UserAccountRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    private final PasswordService passwordService;
    private final UserMapper userMapper;

    public AuthService(
            UserAccountRepository userRepository,
            AuthTokenRepository tokenRepository,
            PasswordService passwordService,
            UserMapper userMapper
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordService = passwordService;
        this.userMapper = userMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = normalizeUsername(request.username());
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce username existe deja");
        }

        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email existe deja");
        }

        UserAccount user = userRepository.save(new UserAccount(
                username,
                email,
                username,
                passwordService.hash(request.password())
        ));
        return createToken(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        UserAccount user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides"));

        if (!passwordService.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides");
        }

        if (passwordService.needsUpgrade(user.getPasswordHash())) {
            user.changePasswordHash(passwordService.hash(request.password()));
            userRepository.save(user);
        }

        return createToken(user);
    }

    @Transactional(readOnly = true)
    public UserDto currentUser(UserAccount user) {
        return userMapper.toDto(user);
    }

    @Transactional
    public void logout(UserAccount user) {
        tokenRepository.deleteByUser(user);
    }

    @Transactional
    public UserDto updateProfile(UserAccount user, ProfileUpdateRequest request) {
        if (StringUtils.hasText(request.displayName())) {
            user.changeDisplayName(request.displayName().trim());
        }

        user.changeAvatarUrl(normalizeNullable(request.avatarUrl()));

        if (StringUtils.hasText(request.password())) {
            user.changePasswordHash(passwordService.hash(request.password()));
        }

        return userMapper.toDto(userRepository.save(user));
    }

    private AuthResponse createToken(UserAccount user) {
        tokenRepository.deleteByExpiresAtBefore(Instant.now());
        Instant expiresAt = Instant.now().plus(TOKEN_TTL);
        AuthToken token = tokenRepository.save(new AuthToken(generateToken(), user, expiresAt));
        return new AuthResponse(token.getToken(), expiresAt, userMapper.toDto(user));
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email requis");
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (!normalizedEmail.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email invalide");
        }
        return normalizedEmail;
    }

    private String normalizeUsername(String username) {
        if (!StringUtils.hasText(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username requis");
        }
        String normalizedUsername = username.trim().toLowerCase(Locale.ROOT);
        if (!normalizedUsername.matches("[a-z0-9._-]{3,80}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Username invalide: utilise 3 a 80 caracteres, lettres, chiffres, point, tiret ou underscore"
            );
        }
        return normalizedUsername;
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

}
