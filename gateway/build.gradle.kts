plugins {
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.apache.httpcomponents.client5:httpclient5")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.session:spring-session-data-redis")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")
}

springBoot {
    mainClass.set("com.example.gateway.GatewayApplication")
}

// Java version is inherited from the root project's 'subprojects' block.
// Removed explicit java block and Kotlin compile tasks.
