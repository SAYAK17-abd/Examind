package com.examind.backend.auth.service;

import com.examind.backend.auth.dto.*;
import com.examind.backend.auth.entity.RefreshToken;
import com.examind.backend.auth.security.JwtTokenProvider;
import com.examind.backend.auth.security.UserPrincipal;
import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.exception.UnauthorizedException;
import com.examind.backend.user.entity.Role;
import com.examind.backend.user.entity.RoleName;
import com.examind.backend.user.entity.User;
import com.examind.backend.user.entity.UserStatus;
import com.examind.backend.user.repository.RoleRepository;
import com.examind.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    @Value("${jwt.access-expiration-ms:86400000}")
    private long jwtAccessExpirationMs;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       RefreshTokenService refreshTokenService,
                       AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest servletRequest) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Email is already registered: " + email, "EMAIL_ALREADY_EXISTS");
        }

        RoleName roleName = request.getRole();
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new BadRequestException("Invalid role specified: " + roleName));

        User user = new User(
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getFirstName().trim(),
                request.getLastName().trim(),
                role,
                UserStatus.ACTIVE
        );

        User savedUser = userRepository.save(user);

        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().getName().name()
        );
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser);

        auditService.log(savedUser.getId(), AuditAction.REGISTER, "USER", String.valueOf(savedUser.getId()),
                "User registered with role " + roleName, servletRequest);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                jwtAccessExpirationMs,
                UserSummaryDto.fromEntity(savedUser)
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest servletRequest) {
        String email = request.getEmail().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        if (userPrincipal.getStatus() == UserStatus.BLOCKED) {
            throw new UnauthorizedException("Your account has been suspended. Please contact administrator.");
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        String accessToken = tokenProvider.generateAccessToken(authentication);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        auditService.log(user.getId(), AuditAction.LOGIN, "USER", String.valueOf(user.getId()),
                "User logged in successfully", servletRequest);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                jwtAccessExpirationMs,
                UserSummaryDto.fromEntity(user)
        );
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String accessToken = tokenProvider.generateAccessToken(
                            user.getId(),
                            user.getEmail(),
                            user.getRole().getName().name()
                    );
                    // Rotate refresh token
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);
                    return new AuthResponse(
                            accessToken,
                            newRefreshToken.getToken(),
                            jwtAccessExpirationMs,
                            UserSummaryDto.fromEntity(user)
                    );
                })
                .orElseThrow(() -> new UnauthorizedException("Refresh token is not in database or was revoked"));
    }

    @Transactional
    public void logout(String refreshToken, HttpServletRequest servletRequest) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.findByToken(refreshToken).ifPresent(token -> {
                auditService.log(token.getUser().getId(), AuditAction.LOGOUT, "USER",
                        String.valueOf(token.getUser().getId()), "User logged out", servletRequest);
                refreshTokenService.revokeToken(refreshToken);
            });
        }
        SecurityContextHolder.clearContext();
    }
}
