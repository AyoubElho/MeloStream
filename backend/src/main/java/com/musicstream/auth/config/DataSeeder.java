package com.musicstream.auth.config;

import java.util.List;

import com.musicstream.auth.dao.UserAccountRepository;
import com.musicstream.auth.model.UserAccount;
import com.musicstream.auth.model.UserRole;
import com.musicstream.auth.service.PasswordService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserAccountRepository userRepository;
    private final PasswordService passwordService;

    public DataSeeder(UserAccountRepository userRepository, PasswordService passwordService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    @Override
    public void run(String... args) {
        List<SeedUser> users = List.of(
                new SeedUser("admin", "admin@melostream.local", "Admin", "admin123", UserRole.ADMIN),
                new SeedUser("ayoub", "ayoub@melostream.local", "Ayoub", "ayoub123", UserRole.USER),
                new SeedUser("demo", "demo@melostream.local", "Demo", "demo123", UserRole.USER),
                new SeedUser("user", "user@melostream.local", "User", "user123", UserRole.USER),
                new SeedUser("root", "root@melostream.local", "Root", "root123", UserRole.ADMIN)
        );

        users.forEach(this::createUserIfMissing);
    }

    private void createUserIfMissing(SeedUser seedUser) {
        userRepository.findByUsernameIgnoreCase(seedUser.username()).ifPresentOrElse(user -> {
            if (user.getName() == null) {
                user.changeName(seedUser.username());
            }
            if (user.getEmail() == null) {
                user.changeEmail(seedUser.email());
            }
            userRepository.save(user);
        }, () -> {
            UserAccount user = new UserAccount(
                    seedUser.username(),
                    seedUser.email(),
                    seedUser.displayName(),
                    passwordService.hash(seedUser.password())
            );
            user.changeRole(seedUser.role());
            userRepository.save(user);
        });
    }

    private record SeedUser(String username, String email, String displayName, String password, UserRole role) {
    }
}
