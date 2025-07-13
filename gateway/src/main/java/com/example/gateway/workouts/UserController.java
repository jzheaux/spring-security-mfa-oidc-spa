package com.example.gateway.workouts;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class UserController {
    @GetMapping("/user")
    String hello(@AuthenticationPrincipal OidcUser user) {
        return "Hello, " + user.getGivenName() + "! \uD83C\uDF89";
    }
}
