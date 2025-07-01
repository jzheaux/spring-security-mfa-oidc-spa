package com.example.api;

import java.io.InputStream;
import java.util.Base64;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {

    @Bean
    SecurityFilterChain httpSecurity(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests((authorize) -> authorize.anyRequest().authenticated())
            .oauth2ResourceServer((oauth2) -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    JwtDecoder decoder() throws Exception {
        ClassPathResource secret = new ClassPathResource("certs/secret.pem");
        try (InputStream in = Base64.getDecoder().wrap(secret.getInputStream())) {
            SecretKeySpec spec = new SecretKeySpec(in.readAllBytes(), "AES");
            return NimbusJwtDecoder.withSecretKey(spec).build();
        }
    }
}
