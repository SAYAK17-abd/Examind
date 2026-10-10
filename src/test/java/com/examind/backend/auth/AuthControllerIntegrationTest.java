package com.examind.backend.auth;

import com.examind.backend.auth.dto.LoginRequest;
import com.examind.backend.auth.dto.RefreshTokenRequest;
import com.examind.backend.auth.dto.RegisterRequest;
import com.examind.backend.user.entity.RoleName;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should successfully register student, log in, and retrieve user profile")
    void testRegisterLoginAndProfile() throws Exception {
        String uniqueEmail = "student_" + System.currentTimeMillis() + "@examind.test";

        RegisterRequest registerRequest = new RegisterRequest(
                uniqueEmail,
                "Password123!",
                "John",
                "Doe",
                RoleName.ROLE_STUDENT
        );

        // 1. Register
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value(uniqueEmail))
                .andReturn();

        // 2. Duplicate registration attempt should return 400 Bad Request
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("EMAIL_ALREADY_EXISTS"));

        // 3. Login with valid credentials
        LoginRequest loginRequest = new LoginRequest(uniqueEmail, "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String accessToken = loginJson.get("data").get("accessToken").asText();
        String refreshToken = loginJson.get("data").get("refreshToken").asText();

        // 4. Access protected profile endpoint with JWT
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(uniqueEmail))
                .andExpect(jsonPath("$.data.role").value("ROLE_STUDENT"));

        // 5. Test Refresh Token
        RefreshTokenRequest refreshReq = new RefreshTokenRequest(refreshToken);
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("Should reject invalid login credentials")
    void testInvalidLoginCredentials() throws Exception {
        LoginRequest invalidLogin = new LoginRequest("nonexistent@examind.test", "WrongPassword");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"));
    }

    @Autowired
    private com.examind.backend.user.repository.UserRepository userRepository;

    @Test
    @DisplayName("Logout should revoke refresh token and prevent subsequent refresh")
    void testLogoutAndRevocation() throws Exception {
        String email = "logout_test_" + System.currentTimeMillis() + "@examind.test";
        RegisterRequest registerRequest = new RegisterRequest(
                email, "Password123!", "Alice", "Logout", RoleName.ROLE_STUDENT
        );

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String refreshToken = json.get("data").get("refreshToken").asText();

        // Perform logout
        RefreshTokenRequest logoutReq = new RefreshTokenRequest(refreshToken);
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Attempting to refresh with the revoked token must fail with 401
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Blocked user cannot log in and receives 401 Unauthorized")
    void testBlockedUserCannotLogin() throws Exception {
        String email = "blocked_test_" + System.currentTimeMillis() + "@examind.test";
        RegisterRequest registerRequest = new RegisterRequest(
                email, "Password123!", "Blocked", "User", RoleName.ROLE_STUDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Update user status to BLOCKED
        com.examind.backend.user.entity.User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        user.setStatus(com.examind.backend.user.entity.UserStatus.BLOCKED);
        userRepository.save(user);

        // Attempt login
        LoginRequest loginRequest = new LoginRequest(email, "Password123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Invalid or malformed JWT token must return 401 Unauthorized")
    void testInvalidJwtTokenRejected() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer invalid.malformed.jwt.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }
}

