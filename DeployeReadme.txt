🚀 Complete Step-by-Step Technical Guide: From Local Git to EC2 Cloud Deployment
Step 1: Pushing the Codebase to GitHub
Before uploading the files, we had to prepare the project so it could be cleanly managed by Git and uploaded without errors.

Creating the .gitignore File
Why? A Java Spring Boot project compiles source code into compiled byte-code (.class and .jar files) inside target folders. Similarly, the React frontend contains a massive node_modules folder (thousands of third-party packages) and a compiled dist directory.
Action: We created a 
.gitignore
 in the root folder containing rules (e.g., **/target/, **/node_modules/, **/dist/) telling Git to ignore these files. This saved gigabytes of upload size and prevented the browser/Git from crashing during upload.
Handling SSL Certificate Errors
The Problem: When attempting to push to GitHub, your system threw a certificate trust error (SEC_E_UNTRUSTED_ROOT). This happens when security software or network proxies intercept your internet connection.
Action: We bypassed this locally inside your Git configuration:
bash


git config http.sslVerify false
Paging and Pushing to GitHub
Action: We initialized a local Git repository, committed all source code, linked your remote GitHub URL, and performed a force-push to overwrite any remote templates with your codebase:
bash


git init
git add .
git commit -m "feat: initial commit of system codebase"
git branch -M main
git remote add origin https://github.com/21A91A1246/cafeteria_management_system.git
git push -u origin main --force
Step 2: Creating CI/CD Pipelines (GitHub Actions)
We built automated pipelines to compile, test, and containerize the application automatically every time you commit code.

How GitHub Actions Works
GitHub Actions runs on GitHub-hosted Runners (virtual machines running in the cloud provided by GitHub).
It looks for configuration files written in YAML inside a special folder: .github/workflows/.
Creating the 7 Individual Workflow Files
Instead of a single giant script, we created 7 separate workflow files (one for api-gateway, auth-service, menu-service, order-service, report-service, payment-service, and frontend).
Why? This is modular CI/CD. If you change a file inside menu-service, only the menu service build will trigger. This saves build minutes.
Pipeline Configuration Structure
Triggers (on:): We configured them to trigger on a push to the main branch, but only when changes are made inside the specific service subdirectory (e.g., backend/menu-service/**).
Manual Trigger (workflow_dispatch): Added this tag to the trigger block so you can log into GitHub, go to the "Actions" tab, select a service, and click a "Run workflow" button to build it manually.
Maven Reactor Commands: Since the parent pom.xml is in the backend folder, we used special flags to tell Maven where the parent configuration is and which specific module to build:
yaml


# -f defines the parent POM file path
# -pl defines the target project list (module name)
# -am tells Maven to compile any sibling dependencies first
run: |
  mvn -f backend/pom.xml -pl menu-service -am clean package
JAR Verification: Added a final CLI step (ls -l backend/<service>/target) to print out the directory structure and verify that the executable .jar file was built successfully.
Step 3: How the Docker Images Were Created and Published
We wrote instructions to turn your code into self-contained container images, and set up GitHub Actions to publish them to your Docker Hub registry.

Understanding the Java Service Dockerfiles We created a Dockerfile inside each microservice directory (e.g. backend/menu-service/Dockerfile). They use a Multi-Stage Build to keep image sizes extremely small:
Stage 1 (Build): Pulls a Maven image, copies the parent POM and all backend source codes, and packages the code into an executable JAR.
Stage 2 (Runtime): Pulls a tiny, lightweight Alpine Java Runtime Environment (JRE) image, copies only the compiled .jar file from Stage 1, and defines the start command:
dockerfile


ENTRYPOINT ["java", "-jar", "app.jar"]
Understanding the Frontend Dockerfile and Nginx Proxy
frontend/Dockerfile: Uses Node.js to install dependencies and compile your React app into static files (dist directory). It then copies those files into a lightweight Nginx web server container.
frontend/nginx.conf: Configures Nginx to serve the React files on port 80. Crucially, it redirects any calls starting with /api to the api-gateway container:
nginx


location /api {
    proxy_pass http://api-gateway:8080;
}
This bypasses CORS errors in production.
Publishing to Docker Hub via GitHub Actions To automate the publishing step, we added these blocks to your .yml workflow files:
Docker Login: Logs into Docker Hub using secrets you configured in your GitHub settings:
yaml


run: echo "${{ secrets.DOCKERHUB_TOKEN }}" | docker login -u "${{ secrets.DOCKERHUB_USERNAME }}" --password-stdin
Docker Build & Push: Compiles the image using the parent subdirectory as the context and uploads the image under your Docker Hub namespace (bharat342002):
yaml


run: |
  docker build -t ${{ secrets.DOCKERHUB_USERNAME }}/menu-service:latest -f backend/menu-service/Dockerfile backend
  docker push ${{ secrets.DOCKERHUB_USERNAME }}/menu-service:latest
Step 4: Creating the Orchestrated Stack (docker-compose.yml)
Instead of starting all 8 containers (MySQL database, 6 backend services, and Nginx frontend) manually, we created a single master orchestrator file in your project root: docker-compose.yml.

Pulling Pre-built Docker Hub Images: Instead of compiling source code on your server, we configured the services to pull the ready-to-run images we published in Step 3 (e.g., image: bharat342002/menu-service:latest).
Configuring Service DNS Names: Docker Compose automatically spins up a virtual bridge network (cafeteria-network). This lets containers talk to each other using their container names as hostnames.
Fixing MySQL 8 Authentication: MySQL 8 uses secure password encryption that blocks JDBC drivers from connecting over unencrypted connections. We solved this by adding this command to the mysql-db container to use native password hashing:
yaml


command: --default-authentication-plugin=mysql_native_password
Coordinating Startup Order: Spring Boot microservices crash on startup if they cannot connect to the database. We configured a healthcheck on MySQL and forced the services to wait until MySQL was fully ready:
yaml


depends_on:
  mysql-db:
    condition: service_healthy
Overriding Inter-Service URLs: We added environment variable mappings to let the containers locate each other (e.g., SERVICES_MENU_SERVICE_URL=http://menu-service:8082 for order-service and report-service).
Step 5: Deploying and Running the Stack on AWS EC2
This is the final phase where your application is deployed to your cloud server.

Installing Docker Compose on EC2
Since docker-compose wasn't installed, we downloaded it directly from GitHub releases and made it executable:
bash


sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
Uploading the Compose File
You created the docker-compose.yml file directly on your EC2 using a text editor:
bash


nano docker-compose.yml
Booting the Stack
Run the command to start the services in the background:
bash


sudo docker-compose up -d
Docker automatically downloaded your images from Docker Hub, waited 11 seconds for the MySQL database container to become healthy, and successfully booted the services.
Configuring Network Security
To access the website from your home browser, you went to the AWS EC2 console and updated your Security Group Inbound Rules to open Port 80 (HTTP) to the public (0.0.0.0/0).
Dynamic Base URL Verification
We updated the React frontend code so that it routes API calls to the server host dynamically. You can now access your app at http://16.16.76.226/ and register/log in securely!
