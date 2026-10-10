# EXAMIND — Security Architecture & Threat Model

## 1. Authentication & Session Management

- **Stateless JWT**: Built using JJWT 0.12.6 with HMAC-SHA256 signatures. Token contains subject (`userId`), email, and assigned role authority (`ROLE_STUDENT`, `ROLE_TEACHER`, `ROLE_ADMIN`).
- **Secret Key Security**: Secret must be >= 256 bits (32 bytes). Injected strictly via `JWT_SECRET` environment variable; fallback placeholder exists only for isolated dev profiles.
- **Refresh Token Rotation**: Refresh tokens are stored in the database (`refresh_tokens` table) with expiration timestamps and explicit revocation flags (`revoked`). Every refresh request generates a new access token and rotates the refresh token.
- **Immediate Invalidation on Logout**: The `/api/auth/logout` endpoint revokes the refresh token immediately in the database.
- **Account Suspension**: The login flow inspects `UserStatus`. Blocked users (`UserStatus.BLOCKED`) are refused token issuance with `401 Unauthorized`.

---

## 2. Authorization & Insecure Direct Object Reference (IDOR) Protections

- **Server-Side RBAC Authority**: Role constraints are enforced in `SecurityConfig.java` and `@PreAuthorize` method annotations. Frontend route guards are purely UX conveniences.
- **Teacher Isolation**: A teacher can only manage, publish, update questions for, or review submissions of exams where `exam.createdBy.id == currentUserId`. Any attempt by another teacher is rejected with `403 Forbidden` (`findExamAndVerifyTeacherAccess`).
- **Student Isolation**: A student can only view and submit their own exam attempts (`submission.student.id == currentUserId`). Any attempt by another student to access `/api/student/submissions/{id}` is rejected with `403 Forbidden`.
- **Result Privacy**: Student results are only visible to the student who took the exam, the teacher who owns the exam, or system administrators.

---

## 3. Secure File Upload Pipeline

Answer sheets uploaded via `/api/submissions/{submissionId}/files` pass through a 5-stage validation gate:

1. **Size Verification**: Enforces a strict 10MB file size limit (`FileValidationException`).
2. **Filename Sanitization & Path Traversal Prevention**: Filenames are stripped of path separators (`..`, `/`, `\`) and normalized using `StringUtils.cleanPath`. Files are stored using a cryptographically generated UUID filename (`sub_{submissionId}_{uuid}.ext`).
3. **Blacklist Extension Blocking**: Prohibits executable and script extensions (`exe`, `bat`, `sh`, `cmd`, `jar`, `py`, `js`, `php`, `vbs`, etc.).
4. **Whitelist MIME & Extension Validation**: Only permits `pdf`, `jpg`, `jpeg`, and `png` with matching content types (`application/pdf`, `image/jpeg`, `image/png`).
5. **Magic Byte Signature Inspection**: Inspects raw leading header bytes to verify authentic file signatures:
   - PDF: `%PDF-` (`0x25 0x50 0x44 0x46`)
   - PNG: `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47`)
   - JPEG: `\xFF\xD8\xFF` (`0xFF 0xD8 0xFF`)
   Mismatched or spoofed extensions are rejected with `400 Bad Request`.

---

## 4. Observability, Correlation & Audit Logging

- **MDC Correlation**: `MdcLoggingFilter` intercepts every incoming HTTP request and binds an `X-Request-ID` UUID to Logback's Mapped Diagnostic Context (MDC).
- **Log Sanitation**: Passwords, tokens, and PII are excluded from log streams.
- **Audit Trails**: Critical state transitions (user registrations, logins, logouts, exam publications, answer submissions, file uploads, teacher score overrides) are recorded in the system audit stream.

