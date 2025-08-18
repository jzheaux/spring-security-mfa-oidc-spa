# Spring Boot mTLS OIDC Example

This project demonstrates a multi-module Gradle-based Spring Boot application featuring an OIDC Authorization Server, a REST API secured with mTLS and bearer tokens, and a Gateway acting as an OAuth2 client and BFF for a simple SPA. All modules are written in Java 21.

## Project Structure

The project consists of three main modules:

*   **`auth-server`:**
    *   An OIDC Authorization Server built using Spring Authorization Server.
    *   Manages user authentication and issues JWTs.
    *   Port: `7443`
    *   Users: `declan` (password: `password`), `admin` (password: `password`)

*   **`api`:**
    *   A REST API for managing "Workout" entities.
    *   Secured as a Resource Server, validating JWT bearer tokens.
    *   Requires mTLS for communication (acts as mTLS server).
    *   Port: `8443` (HTTPS due to mTLS)

*   **`gateway`:**
    *   A Backend-For-Frontend built using Spring Security OAuth2 Client.
    *   Reverse proxies requests to the `api` module, relaying the access token.
    *   Requires mTLS for its outgoing connections to the `api` module (acts as mTLS client).
    *   Serves a simple Single Page Application (SPA) for workout management.
    *   Handles CSRF protection for the SPA.
    *   Port: `9443`

## Technologies Used

*   Java 21
*   Spring Boot 3.x
*   Spring Security 6.x
*   Spring Authorization Server 1.x

## Prerequisites

*   JDK 21 or later
*   Docker 

## Building the Application

To build all modules and run tests:
```bash
./gradlew clean build
```

To skip tests during build:
```bash
./gradlew build -x test
```

## Running the Application

It's recommended to run the applications in the following order:

1.  **Auth Server:**
    ```bash
    ./gradlew :auth-server:bootRun
    ```
    *   Accessible at: `https://authz.127.0.0.1.nip.io:7443`

2.  **API Server:**
    ```bash
    ./gradlew :api:bootRun
    ```
    *   Accessible at: `https://api.127.0.0.1.nip.io:8443`

3.  **Gateway Server:**
    ```bash
    ./gradlew :gateway:bootRun
    ```
    *   Accessible at: `https://gateway.127.0.0.1.nip.io:9443`

## Accessing the Application

1.  Navigate to `https://gateway.127.0.0.1.nip.io:9443/`.
2.  You should be redirected to the `auth-server` for login.
3.  Log in with one of the following credentials:
    *   Username: `declan`, Password: `password`
    *   Username: `admin`, Password: `password`
4.  Upon successful authentication, you will be redirected back to the SPA at `https://gateway.127.0.0.1.nip.io:9443/`.
5.  The SPA allows you to view, add, edit, and delete workouts. These operations are proxied through the gateway to the API.
6.  A "Logout" button is available in the SPA, which will log you out from the `auth-server`.

