plugins {
    java
    id("org.springframework.boot") version "3.5.0" apply false
    id("io.spring.dependency-management") version "1.1.7"
}

allprojects {
    group = "com.example"
    version = "0.0.1-SNAPSHOT"
}

repositories {
    mavenCentral()
    maven("https://repo.spring.io/milestone")
}

subprojects {
    apply(plugin = "java")
    apply(plugin = "io.spring.dependency-management")

    repositories {
        mavenCentral()
        maven("https://repo.spring.io/milestone")
    }

    java {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    dependencies {
        implementation("org.springframework.boot:spring-boot-starter")
        testImplementation("org.springframework.boot:spring-boot-starter-test")
    }

    // Add Spring Cloud BOM for version management
    dependencyManagement {
        imports {
            mavenBom("org.springframework.cloud:spring-cloud-dependencies:2025.0.0-RC1")
        }
    }

    tasks.test {
        useJUnitPlatform()
    }
}


