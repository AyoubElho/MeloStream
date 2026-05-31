package com.musicstream.admin.service;

import java.util.List;
import java.util.Locale;

import com.musicstream.admin.dto.AdminStatsDto;
import com.musicstream.admin.dto.AdminUserDto;
import com.musicstream.admin.dto.RoleUpdateRequest;
import com.musicstream.admin.mapper.AdminUserMapper;
import com.musicstream.auth.dao.AuthTokenRepository;
import com.musicstream.auth.dao.UserAccountRepository;
import com.musicstream.auth.model.UserAccount;
import com.musicstream.auth.model.UserRole;
import com.musicstream.favorites.dao.FavoriteTrackRepository;
import com.musicstream.playlists.dao.PlaylistRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {

    private final UserAccountRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    private final FavoriteTrackRepository favoriteRepository;
    private final PlaylistRepository playlistRepository;
    private final AdminUserMapper adminUserMapper;

    public AdminService(
            UserAccountRepository userRepository,
            AuthTokenRepository tokenRepository,
            FavoriteTrackRepository favoriteRepository,
            PlaylistRepository playlistRepository,
            AdminUserMapper adminUserMapper
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.favoriteRepository = favoriteRepository;
        this.playlistRepository = playlistRepository;
        this.adminUserMapper = adminUserMapper;
    }

    @Transactional(readOnly = true)
    public AdminStatsDto stats() {
        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.countByRole(UserRole.ADMIN);
        return new AdminStatsDto(
                totalUsers,
                totalAdmins,
                favoriteRepository.count(),
                playlistRepository.count(),
                tokenRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> listUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(adminUserMapper::toDto)
                .toList();
    }

    @Transactional
    public AdminUserDto updateRole(UserAccount admin, Long userId, RoleUpdateRequest request) {
        UserAccount user = findUser(userId);
        UserRole role = parseRole(request.role());

        if (admin.getId().equals(user.getId()) && role != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un admin ne peut pas retirer son propre role");
        }

        user.changeRole(role);
        return adminUserMapper.toDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UserAccount admin, Long userId) {
        UserAccount user = findUser(userId);

        if (admin.getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un admin ne peut pas supprimer son propre compte");
        }

        tokenRepository.deleteByUser(user);
        favoriteRepository.deleteByUser(user);
        playlistRepository.deleteByUser(user);
        userRepository.delete(user);
    }

    private UserAccount findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    private UserRole parseRole(String role) {
        try {
            return UserRole.valueOf(role.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role invalide");
        }
    }
}
