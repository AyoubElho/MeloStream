package com.musicstream.auth.controller;

import com.musicstream.auth.dto.AuthResponse;
import com.musicstream.auth.dto.LoginRequest;
import com.musicstream.auth.dto.ProfileUpdateRequest;
import com.musicstream.auth.dto.RegisterRequest;
import com.musicstream.auth.dto.UserDto;
import com.musicstream.auth.model.UserAccount;
import com.musicstream.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal UserAccount user) {
        return authService.currentUser(user);
    }

    @PutMapping("/profile")
    public UserDto updateProfile(
            @AuthenticationPrincipal UserAccount user,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return authService.updateProfile(user, request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal UserAccount user) {
        authService.logout(user);
    }
}
