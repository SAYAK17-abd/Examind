# Multi-stage Docker build for EXAMIND Backend
# Stage 1: Build the application with Maven
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Copy maven wrapper and pom.xml first for layer caching
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Copy source code and package application
COPY src src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal, secure runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install curl for healthcheck and create non-root user
RUN apk add --no-cache curl && \
    addgroup -S examind && adduser -S examind -G examind

# Create uploads directory with appropriate permissions
RUN mkdir -p /app/uploads && chown -R examind:examind /app

# Copy built JAR from builder stage
COPY --from=builder /workspace/target/examind-backend-1.0.0.jar app.jar
RUN chown examind:examind app.jar

USER examind

# Expose server port
EXPOSE 8080

# Production JVM options: memory limits, container awareness
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=prod -jar app.jar"]
