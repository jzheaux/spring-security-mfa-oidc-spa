plugins {
    id("org.springframework.boot")
    id("io.spring.dependency-management")
    // 'java' plugin and Java version are applied from the root project's 'subprojects' block
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("com.h2database:h2")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

// Spring Boot plugin specific configuration if needed
springBoot {
    mainClass.set("com.example.api.ApiApplication")
}
