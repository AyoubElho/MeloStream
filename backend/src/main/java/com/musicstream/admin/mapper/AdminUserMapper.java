package com.musicstream.admin.mapper;

import com.musicstream.admin.dto.AdminUserDto;
import com.musicstream.auth.model.UserAccount;
import org.springframework.stereotype.Component;

@Component
public class AdminUserMapper {

    public AdminUserDto toDto(UserAccount user) {
        return new AdminUserDto(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}
