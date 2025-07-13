package com.example.gateway.workouts;

import static org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
class WorkoutProxyController {

    private final RestClient rest;

    WorkoutProxyController(RestClient.Builder builder) {
        this.rest = builder.baseUrl("https://api.127.0.0.1.nip.io:8443").build();
    }

    @GetMapping("/api/workouts")
    ResponseEntity<String> workouts(HttpServletRequest request) {
        String responseBody = this.rest.get()
                .uri("/workouts")
                .attributes(clientRegistrationId("gateway-client-oidc"))
                .retrieve()
                .body(String.class);
        return ResponseEntity.ok(responseBody);
    }
}
