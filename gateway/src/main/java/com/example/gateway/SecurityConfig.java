package com.example.gateway;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
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
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;

@Configuration
class SecurityConfig {
    @Bean
    JwtEncoder encoder() throws Exception {
        ClassPathResource keyResource = new ClassPathResource("certs/private-key.key");
        ClassPathResource pemResource = new ClassPathResource("certs/public-key.pem");
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");

        try (InputStream keyStream = Base64.getDecoder().wrap(keyResource.getInputStream());
            InputStream pemStream = Base64.getDecoder().wrap(pemResource.getInputStream())) {
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyStream.readAllBytes());
            X509EncodedKeySpec pemSpec = new X509EncodedKeySpec(pemStream.readAllBytes());
            RSAPrivateKey key = (RSAPrivateKey) keyFactory.generatePrivate(keySpec);
            RSAPublicKey pem = (RSAPublicKey) keyFactory.generatePublic(pemSpec);
            RSAKey jwk = new RSAKey.Builder(pem).privateKey(key).build();
            return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
        }
    }

}
