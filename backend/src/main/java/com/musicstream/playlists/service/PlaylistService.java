package com.musicstream.playlists.service;

import java.util.List;
import java.util.Locale;

import com.musicstream.auth.model.UserAccount;
import com.musicstream.music.dto.TrackDto;
import com.musicstream.playlists.dao.PlaylistRepository;
import com.musicstream.playlists.dto.PlaylistDto;
import com.musicstream.playlists.dto.PlaylistRequest;
import com.musicstream.playlists.mapper.PlaylistMapper;
import com.musicstream.playlists.model.Playlist;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistMapper playlistMapper;

    public PlaylistService(
            PlaylistRepository playlistRepository,
            PlaylistMapper playlistMapper
    ) {
        this.playlistRepository = playlistRepository;
        this.playlistMapper = playlistMapper;
    }

    @Transactional(readOnly = true)
    public List<PlaylistDto> list(UserAccount user) {
        return playlistRepository.findByUserOrderByUpdatedAtDesc(user).stream()
                .map(playlistMapper::toDto)
                .toList();
    }

    @Transactional
    public PlaylistDto create(UserAccount user, PlaylistRequest request) {
        String name = normalizeName(request.name());
        ensureNameAvailable(user, name, null);
        Playlist playlist = playlistRepository.save(new Playlist(user, name));
        return playlistMapper.toDto(playlist);
    }

    @Transactional
    public PlaylistDto rename(UserAccount user, Long playlistId, PlaylistRequest request) {
        Playlist playlist = findPlaylist(user, playlistId);
        String name = normalizeName(request.name());
        ensureNameAvailable(user, name, playlistId);
        playlist.rename(name);
        return playlistMapper.toDto(playlist);
    }

    @Transactional
    public void delete(UserAccount user, Long playlistId) {
        Playlist playlist = findPlaylist(user, playlistId);
        playlistRepository.delete(playlist);
    }

    @Transactional
    public PlaylistDto addTrack(UserAccount user, Long playlistId, TrackDto track) {
        Playlist playlist = findPlaylist(user, playlistId);
        String source = sourceFor(track);

        boolean alreadyExists = playlist.getTracks().stream()
                .anyMatch(item -> item.getSource().equals(source) && item.getTrackId().equals(track.id()));

        if (!alreadyExists) {
            playlist.addTrack(playlistMapper.toEntity(playlist, track, source));
        }

        return playlistMapper.toDto(playlist);
    }

    @Transactional
    public PlaylistDto removeTrack(UserAccount user, Long playlistId, String source, String trackId) {
        Playlist playlist = findPlaylist(user, playlistId);
        playlist.removeTrack(normalizeSource(source), trackId);
        return playlistMapper.toDto(playlist);
    }

    private Playlist findPlaylist(UserAccount user, Long playlistId) {
        return playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Playlist introuvable"));
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nom de playlist requis");
        }

        String normalizedName = name.trim();
        if (normalizedName.length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nom de playlist trop long");
        }
        return normalizedName;
    }

    private void ensureNameAvailable(UserAccount user, String name, Long currentPlaylistId) {
        if (currentPlaylistId != null) {
            boolean currentPlaylistUsesName = playlistRepository.findByIdAndUser(currentPlaylistId, user)
                    .map(playlist -> playlist.getName().equalsIgnoreCase(name))
                    .orElse(false);
            if (currentPlaylistUsesName) {
                return;
            }
        }

        if (playlistRepository.existsByUserAndNameIgnoreCase(user, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une playlist avec ce nom existe deja");
        }
    }

    private String sourceFor(TrackDto track) {
        return normalizeSource(track.source());
    }

    private String normalizeSource(String source) {
        if (source != null) {
            String normalizedSource = source.trim().toLowerCase(Locale.ROOT);
            if (normalizedSource.equals("jamendo")) {
                return "jamendo";
            }
        }
        return "deezer";
    }
}
