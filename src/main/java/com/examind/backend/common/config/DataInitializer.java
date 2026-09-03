package com.examind.backend.common.config;

import com.examind.backend.user.entity.Role;
import com.examind.backend.user.entity.RoleName;
import com.examind.backend.user.entity.User;
import com.examind.backend.user.entity.UserStatus;
import com.examind.backend.user.repository.RoleRepository;
import com.examind.backend.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initRolesAndAdmin(RoleRepository roleRepository,
                                              UserRepository userRepository,
                                              PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Roles
            for (RoleName roleName : RoleName.values()) {
                if (!roleRepository.existsByName(roleName)) {
                    Role role = new Role(roleName, "Standard role for " + roleName.name());
                    roleRepository.save(role);
                    log.info("Initialized role: {}", roleName);
                }
            }

            // Seed default Admin if no admin exists
            String adminEmail = "admin@examind.ai";
            if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
                Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                        .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));
                User admin = new User(
                        adminEmail,
                        passwordEncoder.encode("Admin@12345"),
                        "System",
                        "Administrator",
                        adminRole,
                        UserStatus.ACTIVE
                );
                userRepository.save(admin);
                log.info("Initialized default admin user: {}", adminEmail);
            }
        };
    }
}
