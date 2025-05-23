package com.example.gateway.workouts;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
class WorkoutProxyController {

    private final RestClient rest;

    WorkoutProxyController(RestClient.Builder builder) {
        this.rest = builder.baseUrl("http://localhost:8090").build();
    }

    @GetMapping("/api/workouts")
    ResponseEntity<String> workouts() {
        String responseBody = this.rest.get()
                .uri("/workouts")
                .retrieve()
                .body(String.class);
        return ResponseEntity.ok(responseBody);
    }
}
