FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY api-gateway ./api-gateway
COPY auth-service ./auth-service
COPY menu-service ./menu-service
COPY order-service ./order-service
COPY report-service ./report-service
COPY payment-service ./payment-service

RUN mvn -f pom.xml -pl report-service -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/report-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
