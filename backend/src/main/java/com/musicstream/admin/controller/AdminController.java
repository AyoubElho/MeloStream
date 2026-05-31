package com.musicstream.admin.controller;

import java.util.List;

import com.musicstream.admin.dto.AdminStatsDto;
import com.musicstream.admin.dto.AdminUserDto;
import com.musicstream.admin.dto.RoleUpdateRequest;
import com.musicstream.admin.service.AdminService;
import com.musicstream.auth.model.UserAccount;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public AdminStatsDto stats() {
        return adminService.stats();
    }

    @GetMapping("/users")
    public List<AdminUserDto> users() {
        return adminService.listUsers();
    }

    @PutMapping("/users/{userId}/role")
    public AdminUserDto updateRole(
            @AuthenticationPrincipal UserAccount admin,
            @PathVariable Long userId,
            @Valid @RequestBody RoleUpdateRequest request
    ) {
        return adminService.updateRole(admin, userId, request);
    }

    @DeleteMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(
            @AuthenticationPrincipal UserAccount admin,
            @PathVariable Long userId
    ) {
        adminService.deleteUser(admin, userId);
    }
}
