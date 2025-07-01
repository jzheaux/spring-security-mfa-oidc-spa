package com.example.gateway;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class GatewayApplicationTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    JwtEncoder encoder;

    String token() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .subject(authentication.getName())
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(86400))
            .claim("scope", "app")
            .build();
        return this.encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    @WithMockUser
    @Test
    void workoutsEndpoint() throws Exception {
        this.mvc.perform(get("/api/workouts")
                .header("Authorization", "Bearer " + token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(5)));
    }
}