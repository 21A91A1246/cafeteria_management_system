# Office Cafeteria Management System - Production Upgrades Walkthrough

The Office Cafeteria Management System backend has been upgraded with production-grade reliability, fault-tolerance patterns, centralized telemetry hooks, transaction idempotency protections, caching optimization, and unit test coverage.

---

## 1. Caching Optimization (Cache-Aside & Eviction)
We have enabled declarative caching inside the **`menu-service`** to drastically reduce direct database reads for frequently queried data:
* **`EnableCaching`**: Activated Spring Caching on `MenuApplication.java`.
* **Cache-Aside Pattern (`MenuController.java`)**:
  - `@Cacheable(value = "menuItems", key = "'available'")` caches the list of active menu items retrieved by employees.
  - `@Cacheable(value = "menuItems", key = "#id")` caches individual menu items looked up during order validation by `order-service`.
* **Cache Eviction**:
  - `@CacheEvict(value = "menuItems", allEntries = true)` is placed on all database modification endpoints (`createMenuItem`, `updateMenuItem`, and `deleteMenuItem`). This ensures that as soon as the admin edits the menu, stale caches are cleared instantly, maintaining absolute data consistency.

---

## 2. Resilience Patterns (Resilience4j)
We have added Resilience4j integration inside the **`order-service`** to gracefully handle latency spikes and service outages:
* **Circuit Breaker & Retry (`MenuServiceClient.java`)**: 
  - Decorated calling sequences to `menu-service` to query menu details.
  - Configured a threshold where if `50%` of requests fail in a sliding window of size `5` calls, the circuit opens for `10 seconds`.
  - Automatically retries failed network calls up to `3 times` with a `1-second` back-off.
  - Implements a fallback method `fetchMenuItemFallback` that returns a temp-unavailable item object rather than throwing raw TCP socket exceptions.
* **Rate Limiter (`OrderController.java`)**:
  - Placed a `@RateLimiter(name = "orderRateLimiter")` protection on the order placement API.
  - Restricts clients to a maximum of `5 checkouts per minute`. 
  - If exceeded, it triggers `placeOrderFallback` which cleanly returns an HTTP `429 Too Many Requests` status code along with a `Retry-After: 60` response header.

---

## 3. Distributed Tracing & Observability
We have added Micrometer Tracing and Spring Boot Actuator monitoring across all modules via the parent POM configurations:
* **Centralized Telemetry**: All services import `spring-boot-starter-actuator` and `micrometer-registry-prometheus` to automatically expose telemetry metrics.
* **Scrape Endpoints**: Every service exposes metrics at `/actuator/health` and `/actuator/prometheus` (compatible with Prometheus and Grafana scrapers).
* **Request Correlation**: Configured `micrometer-tracing-bridge-otel` to auto-inject trace and span tags (`traceId`, `spanId`) into incoming and outgoing requests across the system.

---

## 4. Transactional Idempotency (`payment-service`)
To protect against network dropouts causing duplicate billing transactions during retries:
* **Idempotency Guard**: Added a query check inside `PaymentController.processPayment` to search `paymentRepository.findByOrderId(orderId)`.
* **Deduplication**: If a successful transaction is already logged for that `orderId`, the controller immediately returns the existing payment receipt. This prevents double-charging employees.

---

## 5. Test Coverage (JUnit 5 & Mockito)
Implemented testing under the `payment-service` to confirm behavioral specifications:
* **`PaymentControllerTest.java`**:
  - Tests successful payments under a mocked RestTemplate exchange.
  - Asserts that duplicate payment request submissions trigger the idempotency check and return the existing record without updating the database or invoking external services again.
  - Includes a Byte Buddy experimental VM property fallback to ensure tests run seamlessly on modern runtimes (such as Java 25).

---

## Instructions to Verify

### 1. Execute Unit Tests
Verify compilation and assert test suites run successfully:
```bash
mvn clean test
```

### 2. Verify Actuators & Metrics
1. Boot the stack using `./run_all.ps1`.
2. Open your browser and navigate to:
   - Order Service health: `http://localhost:8083/actuator/health`
   - Order Service prometheus: `http://localhost:8083/actuator/prometheus`
   - Payment Service prometheus: `http://localhost:8086/actuator/prometheus`

### 3. Verify Rate Limiting (429)
Submit more than 5 rapid checkout requests in under a minute to trigger the rate limiter. The server will respond with HTTP status `429 Too Many Requests`.

---

## 6. Cloud Deployment Guide & Infrastructure Files

To deploy the multi-module microservice architecture to cloud platforms (such as AWS ECS/EKS, Google Cloud GKE, Azure Container Apps, or Render/Heroku), the system must be containerized and configuration values overridden dynamically.

### A. Microservices Dockerfile (Sample for Spring Boot Submodules)
Save the following multi-stage `Dockerfile` in the root directory of each microservice module (e.g., `api-gateway/Dockerfile`, `order-service/Dockerfile`, etc.):

```dockerfile
# Stage 1: Build the JAR file
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Copy parent POM dependency specifications if needed or cache dependencies
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### B. React Frontend Dockerfile (`frontend/Dockerfile`)
Containerize the Vite React client using Nginx to serve static files and reverse-proxy backend traffic:

```dockerfile
# Stage 1: Build production static files
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Frontend Nginx config (`frontend/nginx.conf`):
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy backend API calls through Nginx to avoid CORS issues in production
    location /api {
        proxy_pass http://api-gateway:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### C. Multi-Container Orchestration (`docker-compose.yml`)
Save this `docker-compose.yml` in the root folder to spin up the entire local cloud emulation stack:

```yaml
version: '3.8'

services:
  # MySQL Database container shared across services
  mysql-db:
    image: mysql:8.0
    container_name: cafeteria-mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - cafeteria-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot"]
      interval: 10s
      timeout: 5s
      retries: 5

  api-gateway:
    image: bharat342002/api-gateway:latest
    container_name: api-gateway
    ports:
      - "8080:8080"
    environment:
      - SERVER_PORT=8080
      - SERVICES_AUTH_SERVICE_URL=http://auth-service:8085
      - SERVICES_MENU_SERVICE_URL=http://menu-service:8082
      - SERVICES_ORDER_SERVICE_URL=http://order-service:8083
      - SERVICES_REPORT_SERVICE_URL=http://report-service:8084
      - SERVICES_PAYMENT_SERVICE_URL=http://payment-service:8086
    networks:
      - cafeteria-network
    depends_on:
      - auth-service
      - menu-service
      - order-service
      - report-service
      - payment-service

  auth-service:
    image: bharat342002/auth-service:latest
    container_name: auth-service
    ports:
      - "8085:8085"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql-db:3306/cafeteria_auth_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root
    networks:
      - cafeteria-network
    depends_on:
      mysql-db:
        condition: service_healthy

  menu-service:
    image: bharat342002/menu-service:latest
    container_name: menu-service
    ports:
      - "8082:8082"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql-db:3306/cafeteria_menu_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root
    networks:
      - cafeteria-network
    depends_on:
      mysql-db:
        condition: service_healthy

  order-service:
    image: bharat342002/order-service:latest
    container_name: order-service
    ports:
      - "8083:8083"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql-db:3306/cafeteria_order_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root
      - SERVICES_MENU_SERVICE_URL=http://menu-service:8082
    networks:
      - cafeteria-network
    depends_on:
      mysql-db:
        condition: service_healthy

  report-service:
    image: bharat342002/report-service:latest
    container_name: report-service
    ports:
      - "8084:8084"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql-db:3306/cafeteria_report_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root
      - SERVICES_ORDER_SERVICE_URL=http://order-service:8083
    networks:
      - cafeteria-network
    depends_on:
      mysql-db:
        condition: service_healthy

  payment-service:
    image: bharat342002/payment-service:latest
    container_name: payment-service
    ports:
      - "8086:8086"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql-db:3306/cafeteria_payment_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root
      - SERVICES_ORDER_SERVICE_URL=http://order-service:8083
    networks:
      - cafeteria-network
    depends_on:
      mysql-db:
        condition: service_healthy

  frontend:
    image: bharat342002/cafeteria-frontend:latest
    container_name: cafeteria-frontend
    ports:
      - "80:80"
    networks:
      - cafeteria-network
    depends_on:
      - api-gateway

volumes:
  mysql-data:

networks:
  cafeteria-network:
    driver: bridge
```

### D. Production Environment Variables Override Checklist
When deploying to cloud container registries, replace default variables with environment variables:

| Environment Variable | Description / Purpose | Production Value Example |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | Cloud SQL instance DB host address | `jdbc:mysql://aws-rds-endpoint:3306/db?useSSL=true` |
| `SPRING_DATASOURCE_USERNAME` | Cloud database user credentials | `admin_production` |
| `SPRING_DATASOURCE_PASSWORD` | Cloud database secret password | `s3cr3tPassword!` |
| `SERVICES_MENU_SERVICE_URL` | Host address of Menu microservice | `http://menu-service-dns-or-k8s-service:8082` |
| `SERVICES_ORDER_SERVICE_URL` | Host address of Order microservice | `http://order-service-dns-or-k8s-service:8083` |
| `JWT_SECRET` | 256-bit secure signing secret key | `SecureRandomlyGeneratedProductionJwtSecretKey...` |

