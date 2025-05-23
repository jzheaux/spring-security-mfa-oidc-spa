# Spring Boot mTLS OIDC Example

This project demonstrates a multi-module Gradle-based Spring Boot application featuring an OIDC Authorization Server, a REST API secured with mTLS and bearer tokens, and a Gateway acting as an OAuth2 client and BFF for a simple SPA. All modules are written in Java 21.

## Project Structure

The project consists of three main modules:

*   **`auth-server` (Module C):**
    *   An OIDC Authorization Server built using Spring Authorization Server.
    *   Manages user authentication and issues JWTs.
    *   Port: `9000`
    *   Users: `declan` (password: `password`), `admin` (password: `password`)

*   **`api` (Module A):**
    *   A REST API for managing "Workout" entities.
    *   Secured as a Resource Server, validating JWT bearer tokens.
    *   Requires mTLS for communication (acts as mTLS server).
    *   Uses Spring Data JPA with an in-memory H2 database.
    *   Port: `8090` (HTTPS due to mTLS)

*   **`gateway` (Module B):**
    *   A Backend-For-Frontend (BFF) built using Spring Cloud Gateway (Servlet Edition - MVC).
    *   Acts as an OAuth2 client, authenticating users against the `auth-server`.
    *   Reverse proxies requests to the `api` module, relaying the access token.
    *   Requires mTLS for its outgoing connections to the `api` module (acts as mTLS client).
    *   Serves a simple Single Page Application (SPA) for workout management.
    *   Handles CSRF protection for the SPA.
    *   Port: `8080`

## Technologies Used

*   Java 21
*   Gradle 8.x
*   Spring Boot 3.x
*   Spring Security 6.x
*   Spring Authorization Server 1.x
*   Spring Cloud Gateway (Servlet Edition - MVC)
*   Spring Data JPA / Hibernate
*   H2 Database (In-memory)
*   Mutual TLS (mTLS)
*   Testcontainers (for E2E tests)
*   WireMock (for E2E tests)

## Prerequisites

*   JDK 21 or later
*   Gradle 8.x or later (the project uses the Gradle wrapper `./gradlew`)
*   Docker (implicitly required by Testcontainers for running E2E tests, but not for standard application execution if Testcontainers are not run).

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
    *   Accessible at: `http://localhost:9000`
    *   Provides OIDC discovery at `http://localhost:9000/.well-known/openid-configuration`

2.  **API Server:**
    ```bash
    ./gradlew :api:bootRun
    ```
    *   Accessible at: `https://localhost:8090` (Note: HTTPS)
    *   H2 Console (dev only): `http://localhost:8090/h2-console` (JDBC URL: `jdbc:h2:mem:apidb`, User: `sa`, Pass: `password`)

3.  **Gateway Server:**
    ```bash
    ./gradlew :gateway:bootRun
    ```
    *   Accessible at: `http://127.0.0.1:8080` (This is the main entry point for users)

## Accessing the Application

1.  Open your browser and navigate to `http://127.0.0.1:8080/`.
2.  You should be redirected to the `auth-server` for login (e.g., `http://localhost:9000/login`).
3.  Log in with one of the following credentials:
    *   Username: `declan`, Password: `password`
    *   Username: `admin`, Password: `password`
4.  Upon successful authentication, you will be redirected back to the SPA at `http://127.0.0.1:8080/`.
5.  The SPA allows you to view, add, edit, and delete workouts. These operations are proxied through the gateway to the API.
6.  A "Logout" button is available in the SPA, which will log you out from the `auth-server`.

## Mutual TLS (mTLS) Configuration

*   mTLS is enforced for communication between the `gateway` (acting as mTLS client) and the `api` module (acting as mTLS server).
*   **API Server (mTLS Server):**
    *   Keystore: `api/src/main/resources/certs/api-server.p12`
    *   Truststore (for client certs): `api/src/main/resources/certs/api-truststore.p12` (trusts `client-ca.pem`)
*   **Gateway (mTLS Client):**
    *   Keystore (client cert): `gateway/src/main/resources/certs/gateway-client.p12` (signed by `client-ca.pem`)
    *   Truststore (for server certs): `gateway/src/main/resources/certs/gateway-truststore.p12` (trusts `api-server-cert.pem`)
*   All generated certificates and keystores use the password `password`.
*   The Client CA certificate (`client-ca.pem` and key `client-ca.key`) and API server certificate (`api-server-cert.pem`) are expected to be in the project root from generation steps (these are not packaged but used for generation).

## Testing

To run all unit and integration tests for all modules:
```bash
./gradlew test
```
*   The `gateway` module includes E2E tests (`GatewayE2ETests.java`) that use Testcontainers to spin up a mock OAuth2 server and a WireMock instance for the API backend. These tests verify login redirection and authenticated API proxying.

```
