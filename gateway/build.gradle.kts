plugins {
    id("org.springframework.boot")
    id("io.spring.dependency-management") // Ensure this is applied
    // 'java' plugin and Java version are applied from the root project's 'subprojects' block
}

// Spring Cloud BOM is managed in the root build.gradle.kts

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web") // Needed for RestController and RestClient
    implementation("org.apache.httpcomponents.client5:httpclient5") // Retained for RestClient if it uses Apache HTTP Client
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")
    // testImplementation("org.testcontainers:wiremock:1.19.3") 
    // testImplementation("org.testcontainers:mockserver-client:1.19.3") // Not using MockServer for now
    // testImplementation("org.testcontainers:toxiproxy:1.19.3") // Optional
    // For mTLS capable TestRestTemplate if tests need to make actual mTLS calls
}

springBoot {
    mainClass.set("com.example.gateway.GatewayApplication")
}

// Java version is inherited from the root project's 'subprojects' block.
// Removed explicit java block and Kotlin compile tasks.
