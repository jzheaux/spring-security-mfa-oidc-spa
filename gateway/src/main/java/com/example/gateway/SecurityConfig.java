package com.example.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.session.data.redis.RedisIndexedSessionRepository;
import org.springframework.session.security.SpringSessionBackedSessionRegistry;

@Configuration
class SecurityConfig {

    @Bean
    SecurityFilterChain httpSecurity(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests((authorize) -> authorize.anyRequest().authenticated())
            .oauth2Login(Customizer.withDefaults())
            .logout((logout) -> logout.deleteCookies("SESSION"));
        return http.build();
    }


    @Bean
    OAuth2AuthorizedClientRepository authorizedClients() {
        return new HttpSessionOAuth2AuthorizedClientRepository();
    }

    @Bean
    SessionRegistry sessionRegistry(RedisIndexedSessionRepository repository) {
        return new SpringSessionBackedSessionRegistry<>(repository);
    }
}
