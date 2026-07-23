FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent POM and all module source codes
COPY pom.xml .
COPY api-gateway ./api-gateway
COPY auth-service ./auth-service
COPY menu-service ./menu-service
COPY order-service ./order-service
COPY report-service ./report-service
COPY payment-service ./payment-service

# Build only the API Gateway module
RUN mvn -f pom.xml -pl api-gateway -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
