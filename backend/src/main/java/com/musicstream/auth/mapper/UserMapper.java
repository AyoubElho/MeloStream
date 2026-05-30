package com.musicstream.auth.mapper;

import com.musicstream.auth.dto.UserDto;
import com.musicstream.auth.model.UserAccount;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(UserAccount user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name(),
                user.getAvatarUrl(),
                user.getCreatedAt()
        );
    }
}
