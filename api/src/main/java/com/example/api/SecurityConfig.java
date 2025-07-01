package com.example.api;

import java.io.InputStream;
import java.security.Key;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
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
        ClassPathResource resource = new ClassPathResource("certs/public-key.pem");
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        try (InputStream in = Base64.getDecoder().wrap(resource.getInputStream())) {
            X509EncodedKeySpec spec = new X509EncodedKeySpec(in.readAllBytes());
            RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(spec);
            return NimbusJwtDecoder.withPublicKey(publicKey).build();
        }
    }
}
