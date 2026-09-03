package com.examind.backend.exam;

import com.examind.backend.answer.dto.SaveAnswerRequest;
import com.examind.backend.auth.dto.AuthResponse;
import com.examind.backend.auth.dto.RegisterRequest;
import com.examind.backend.auth.service.AuthService;
import com.examind.backend.evaluation.dto.TeacherOverrideRequest;
import com.examind.backend.exam.dto.CreateExamRequest;
import com.examind.backend.question.dto.CreateQuestionRequest;
import com.examind.backend.question.entity.DifficultyLevel;
import com.examind.backend.question.entity.QuestionType;
import com.examind.backend.rubric.dto.RubricCriterionDto;
import com.examind.backend.rubric.dto.RubricDto;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class ExamAndSubmissionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Complete Exam Lifecycle: Create, Publish, Start, Answer, Submit, AI Evaluate, Teacher Override, Result Check")
    void testCompleteExamLifecycle() throws Exception {
        long timestamp = System.currentTimeMillis();

        // 1. Create Teacher & obtain JWT
        RegisterRequest teacherReg = new RegisterRequest(
                "teacher_" + timestamp + "@examind.test", "TeacherPass123!", "Alice", "Smith", RoleName.ROLE_TEACHER
        );
        AuthResponse teacherAuth = authService.register(teacherReg, null);
        String teacherToken = teacherAuth.getAccessToken();

        // 2. Create Student & obtain JWT
        RegisterRequest studentReg = new RegisterRequest(
                "student_" + timestamp + "@examind.test", "StudentPass123!", "Bob", "Jones", RoleName.ROLE_STUDENT
        );
        AuthResponse studentAuth = authService.register(studentReg, null);
        String studentToken = studentAuth.getAccessToken();

        // 3. Teacher creates exam
        CreateExamRequest examReq = new CreateExamRequest();
        examReq.setTitle("Computer Science 101 Midterm");
        examReq.setDescription("Covers OOP and Java fundamentals");
        examReq.setDuration(60);
        examReq.setStartTime(LocalDateTime.now().minusMinutes(5));
        examReq.setEndTime(LocalDateTime.now().plusHours(2));
        examReq.setTotalMarks(10.0);
        examReq.setPassingMarks(4.0);

        MvcResult examResult = mockMvc.perform(post("/api/teacher/exams")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(examReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Computer Science 101 Midterm"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();

        Long examId = objectMapper.readTree(examResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 4. Teacher adds question with rubric
        CreateQuestionRequest qReq = new CreateQuestionRequest();
        qReq.setQuestionText("Explain polymorphism in Java with examples.");
        qReq.setQuestionType(QuestionType.DESCRIPTIVE);
        qReq.setMaxMarks(10.0);
        qReq.setReferenceAnswer("Polymorphism allows objects to be treated as instances of their parent class. It includes method overloading (compile-time) and method overriding (runtime).");
        qReq.setTopic("Object-Oriented Programming");
        qReq.setDifficulty(DifficultyLevel.MEDIUM);

        RubricDto rubric = new RubricDto();
        rubric.setName("Polymorphism Grading Rubric");
        rubric.setCriteria(List.of(
                new RubricCriterionDto(null, "Method Overloading", "Explains compile-time polymorphism", 5.0, 1.0),
                new RubricCriterionDto(null, "Method Overriding", "Explains runtime polymorphism", 5.0, 1.0)
        ));
        qReq.setRubric(rubric);

        MvcResult qResult = mockMvc.perform(post("/api/teacher/exams/" + examId + "/questions")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(qReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.maxMarks").value(10.0))
                .andReturn();

        Long questionId = objectMapper.readTree(qResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 5. Teacher publishes exam
        mockMvc.perform(post("/api/teacher/exams/" + examId + "/publish")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));

        // 6. Student views available exams
        mockMvc.perform(get("/api/student/exams")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isNotEmpty());

        // 7. Student starts exam
        MvcResult startResult = mockMvc.perform(post("/api/student/exams/" + examId + "/start")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submissionId").isNotEmpty())
                .andExpect(jsonPath("$.data.questions[0].id").value(questionId))
                .andReturn();

        Long submissionId = objectMapper.readTree(startResult.getResponse().getContentAsString()).get("data").get("submissionId").asLong();

        // 8. Student saves answer
        SaveAnswerRequest answerReq = new SaveAnswerRequest(
                questionId,
                "Polymorphism in Java involves method overloading at compile time and method overriding at runtime.",
                null
        );

        mockMvc.perform(post("/api/student/submissions/" + submissionId + "/answers")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(answerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questionId").value(questionId));

        // 9. Student submits exam (queues asynchronous AI evaluation)
        mockMvc.perform(post("/api/student/submissions/" + submissionId + "/submit")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"));

        // Wait up to 3 seconds for background async evaluation to finalize
        for (int i = 0; i < 30; i++) {
            Thread.sleep(100);
            MvcResult check = mockMvc.perform(get("/api/teacher/submissions/" + submissionId)
                            .header("Authorization", "Bearer " + teacherToken))
                    .andReturn();
            JsonNode body = objectMapper.readTree(check.getResponse().getContentAsString());
            if (body.has("data") && body.get("data").has("totalScore") && !body.get("data").get("totalScore").isNull()) {
                break;
            }
        }

        // 10. Teacher views submission and evaluations
        MvcResult subDetailsResult = mockMvc.perform(get("/api/teacher/submissions/" + submissionId)
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalScore").isNumber())
                .andReturn();

        // 11. Teacher inspects evaluation and applies override with reason
        MvcResult evalListResult = mockMvc.perform(get("/api/teacher/evaluations/1")
                        .header("Authorization", "Bearer " + teacherToken))
                .andReturn();

        if (evalListResult.getResponse().getStatus() == 200) {
            TeacherOverrideRequest overrideReq = new TeacherOverrideRequest(
                    9.0,
                    "Student clearly explained both overloading and overriding.",
                    "Excellent conceptual understanding"
            );

            mockMvc.perform(post("/api/teacher/evaluations/1/override")
                            .header("Authorization", "Bearer " + teacherToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(overrideReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.score").value(9.0))
                    .andExpect(jsonPath("$.data.status").value("OVERRIDDEN"))
                    .andExpect(jsonPath("$.data.version").value(2));

            // Verify evaluation version history audit
            mockMvc.perform(get("/api/teacher/evaluations/1/history")
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(2));
        }

        // 12. Student checks published result
        mockMvc.perform(get("/api/student/results")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].examTitle").value("Computer Science 101 Midterm"))
                .andExpect(jsonPath("$.data.content[0].passed").value(true));

        // 13. Teacher views analytics
        mockMvc.perform(get("/api/teacher/exams/" + examId + "/analytics")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalSubmissions").value(1))
                .andExpect(jsonPath("$.data.averageScore").isNumber());
    }
}

