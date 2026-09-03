package com.examind.backend.security;

import com.examind.backend.auth.dto.AuthResponse;
import com.examind.backend.auth.dto.RegisterRequest;
import com.examind.backend.auth.service.AuthService;
import com.examind.backend.user.entity.RoleName;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class SecurityAndOwnershipTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Unauthenticated request to protected endpoint should return 401 Unauthorized")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Student trying to access Teacher exam creation endpoint should return 403 Forbidden")
    void testRoleAuthorizationConstraint() throws Exception {
        long ts = System.currentTimeMillis();
        RegisterRequest studentReq = new RegisterRequest(
                "stu_sec_" + ts + "@examind.test", "Pass12345!", "Test", "Student", RoleName.ROLE_STUDENT
        );
        AuthResponse studentAuth = authService.register(studentReq, null);

        mockMvc.perform(get("/api/teacher/exams")
                        .header("Authorization", "Bearer " + studentAuth.getAccessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Teacher trying to access Admin user management should return 403 Forbidden")
    void testTeacherCannotAccessAdmin() throws Exception {
        long ts = System.currentTimeMillis();
        RegisterRequest teacherReq = new RegisterRequest(
                "teach_sec_" + ts + "@examind.test", "Pass12345!", "Test", "Teacher", RoleName.ROLE_TEACHER
        );
        AuthResponse teacherAuth = authService.register(teacherReq, null);

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + teacherAuth.getAccessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }
}

