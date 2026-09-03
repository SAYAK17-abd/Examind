package com.examind.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class SwaggerDocsTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testApiDocs() throws Exception {
        MvcResult result = mockMvc.perform(get("/api-docs")).andReturn();
        System.out.println("STATUS: " + result.getResponse().getStatus());
        System.out.println("CONTENT: " + result.getResponse().getContentAsString());
        if (result.getResolvedException() != null) {
            result.getResolvedException().printStackTrace();
        }
    }
}

