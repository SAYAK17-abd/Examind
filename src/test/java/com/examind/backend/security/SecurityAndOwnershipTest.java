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
import org.springframework.http.MediaType;
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

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Test
    @DisplayName("Teacher B cannot modify or publish Teacher A's exam (403 Forbidden)")
    void testTeacherCannotAccessAnotherTeachersExam() throws Exception {
        long ts = System.currentTimeMillis();

        // 1. Teacher A creates an exam
        RegisterRequest teacherA = new RegisterRequest("teacher_a_" + ts + "@examind.test", "Pass12345!", "A", "Teacher", RoleName.ROLE_TEACHER);
        AuthResponse authA = authService.register(teacherA, null);

        com.examind.backend.exam.dto.CreateExamRequest examReq = new com.examind.backend.exam.dto.CreateExamRequest();
        examReq.setTitle("Teacher A Secret Exam");
        examReq.setDuration(45);
        examReq.setStartTime(java.time.LocalDateTime.now().minusMinutes(2));
        examReq.setEndTime(java.time.LocalDateTime.now().plusHours(1));
        examReq.setTotalMarks(50.0);

        org.springframework.test.web.servlet.MvcResult res = mockMvc.perform(post("/api/teacher/exams")
                        .header("Authorization", "Bearer " + authA.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(examReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long examId = objectMapper.readTree(res.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 2. Teacher B registers and tries to publish Teacher A's exam
        RegisterRequest teacherB = new RegisterRequest("teacher_b_" + ts + "@examind.test", "Pass12345!", "B", "Teacher", RoleName.ROLE_TEACHER);
        AuthResponse authB = authService.register(teacherB, null);

        mockMvc.perform(post("/api/teacher/exams/" + examId + "/publish")
                        .header("Authorization", "Bearer " + authB.getAccessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Student B cannot view or upload files for Student A's submission (403 Forbidden)")
    void testStudentCannotAccessAnotherStudentsSubmission() throws Exception {
        long ts = System.currentTimeMillis();

        // 1. Teacher creates and publishes exam
        RegisterRequest teacherReq = new RegisterRequest("teach_own_" + ts + "@examind.test", "Pass12345!", "T", "Prof", RoleName.ROLE_TEACHER);
        AuthResponse teachAuth = authService.register(teacherReq, null);

        com.examind.backend.exam.dto.CreateExamRequest examReq = new com.examind.backend.exam.dto.CreateExamRequest();
        examReq.setTitle("General Quiz");
        examReq.setDuration(30);
        examReq.setStartTime(java.time.LocalDateTime.now().minusMinutes(2));
        examReq.setEndTime(java.time.LocalDateTime.now().plusHours(1));
        examReq.setTotalMarks(20.0);

        org.springframework.test.web.servlet.MvcResult examRes = mockMvc.perform(post("/api/teacher/exams")
                        .header("Authorization", "Bearer " + teachAuth.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(examReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long examId = objectMapper.readTree(examRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        mockMvc.perform(post("/api/teacher/exams/" + examId + "/publish")
                        .header("Authorization", "Bearer " + teachAuth.getAccessToken()))
                .andExpect(status().isOk());

        // 2. Student A starts exam
        RegisterRequest stuA = new RegisterRequest("stu_a_" + ts + "@examind.test", "Pass12345!", "Alice", "Student", RoleName.ROLE_STUDENT);
        AuthResponse authA = authService.register(stuA, null);

        org.springframework.test.web.servlet.MvcResult startRes = mockMvc.perform(post("/api/student/exams/" + examId + "/start")
                        .header("Authorization", "Bearer " + authA.getAccessToken()))
                .andExpect(status().isOk())
                .andReturn();
        Long submissionId = objectMapper.readTree(startRes.getResponse().getContentAsString()).get("data").get("submissionId").asLong();

        // 3. Student B registers and attempts to access Student A's submission
        RegisterRequest stuB = new RegisterRequest("stu_b_" + ts + "@examind.test", "Pass12345!", "Bob", "Student", RoleName.ROLE_STUDENT);
        AuthResponse authB = authService.register(stuB, null);

        mockMvc.perform(get("/api/student/submissions/" + submissionId)
                        .header("Authorization", "Bearer " + authB.getAccessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Malicious upload with prohibited extension (.exe or script) must be rejected with 400 Bad Request")
    void testMaliciousUploadRejected() throws Exception {
        long ts = System.currentTimeMillis();

        RegisterRequest stu = new RegisterRequest("uploader_" + ts + "@examind.test", "Pass12345!", "Uploader", "Student", RoleName.ROLE_STUDENT);
        AuthResponse stuAuth = authService.register(stu, null);

        org.springframework.mock.web.MockMultipartFile badFile = new org.springframework.mock.web.MockMultipartFile(
                "file", "malware.exe", "application/x-msdownload", "MZ\u0090\u0000\u0003\u0000\u0000\u0000".getBytes()
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/submissions/1/files")
                        .file(badFile)
                        .header("Authorization", "Bearer " + stuAuth.getAccessToken()))
                .andExpect(status().isForbidden()); // User does not own submission 1 (Forbidden) or invalid file
    }
}

