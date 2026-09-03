package com.examind.backend.common.config;

import com.examind.backend.common.audit.AuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    private static final int MAX_REQUESTS_PER_MINUTE = 20;
    private static final long TIME_WINDOW_MS = 60000;

    private final Map<String, RequestBucket> ipBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();

        if (uri.endsWith("/api/auth/login") || uri.endsWith("/api/auth/register")) {
            String clientIp = AuditService.extractClientIp(request);
            long now = System.currentTimeMillis();

            RequestBucket bucket = ipBuckets.compute(clientIp, (ip, currentBucket) -> {
                if (currentBucket == null || (now - currentBucket.windowStart) > TIME_WINDOW_MS) {
                    return new RequestBucket(now, 1);
                } else {
                    currentBucket.count++;
                    return currentBucket;
                }
            });

            if (bucket.count > MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit exceeded for IP {} on URI {}", clientIp, uri);
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":429,\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Too many authentication requests. Please wait a moment before retrying.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private static class RequestBucket {
        final long windowStart;
        int count;

        RequestBucket(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}

