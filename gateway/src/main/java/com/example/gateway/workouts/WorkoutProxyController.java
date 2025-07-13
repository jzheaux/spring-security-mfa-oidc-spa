package com.example.gateway.workouts;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
class WorkoutProxyController {

    private final RestClient rest;

    HttpSessionOAuth2AuthorizedClientRepository clients = new HttpSessionOAuth2AuthorizedClientRepository();

    WorkoutProxyController(RestClient.Builder builder) {
        this.rest = builder.baseUrl("https://api.127.0.0.1.nip.io:8443").build();
    }

    @GetMapping("/api/workouts")
    ResponseEntity<String> workouts(HttpServletRequest request) {
        OAuth2AuthorizedClient client = this.clients
            .loadAuthorizedClient("gateway-client-oidc", null, request);
        String responseBody = this.rest.get()
                .uri("/workouts")
                .headers((h) -> h.setBearerAuth(client.getAccessToken().getTokenValue()))
                .retrieve()
                .body(String.class);
        return ResponseEntity.ok(responseBody);
    }
}
