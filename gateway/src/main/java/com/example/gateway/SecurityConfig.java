package com.example.gateway;

import java.io.InputStream;
import java.util.Base64;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;

@Configuration
class SecurityConfig {
    @Bean
    JwtEncoder encoder() throws Exception {
        ClassPathResource secret = new ClassPathResource("certs/secret.pem");
        try (InputStream in = Base64.getDecoder().wrap(secret.getInputStream())) {
            SecretKeySpec spec = new SecretKeySpec(in.readAllBytes(), "AES");
            OctetSequenceKey key = new OctetSequenceKey.Builder(spec).build();
            return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(key)));
        }
    }

}
