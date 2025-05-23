package com.example.authserver;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
// import org.springframework.test.context.ActiveProfiles; // Optional

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

@SpringBootTest
// @ActiveProfiles("test") // Example if you have a test application.properties
public class AuthServerConfigTests {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private RegisteredClientRepository registeredClientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void userDeclanShouldBeConfigured() {
        UserDetails userDetails = userDetailsService.loadUserByUsername("declan");
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("declan");
        assertThat(passwordEncoder.matches("password", userDetails.getPassword())).isTrue();
        assertThat(userDetails.getAuthorities()).anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_USER"));
        assertThat(userDetails.getAuthorities()).anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("OIDC_USER"));
    }

    @Test
    void userAdminShouldBeConfigured() {
        UserDetails userDetails = userDetailsService.loadUserByUsername("admin");
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("admin");
        assertThat(passwordEncoder.matches("password", userDetails.getPassword())).isTrue();
        assertThat(userDetails.getAuthorities()).anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
        assertThat(userDetails.getAuthorities()).anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("OIDC_USER"));
    }

    @Test
    void gatewayClientShouldBeRegistered() {
        RegisteredClient client = registeredClientRepository.findByClientId("gateway-client");
        assertThat(client).isNotNull();
        assertThat(client.getClientId()).isEqualTo("gateway-client");
        // Note: client secret is encoded. We check other properties.
        assertThat(client.getClientAuthenticationMethods()).contains(org.springframework.security.oauth2.core.ClientAuthenticationMethod.CLIENT_SECRET_BASIC);
        assertThat(client.getAuthorizationGrantTypes()).containsAll(
                Set.of(org.springframework.security.oauth2.core.AuthorizationGrantType.AUTHORIZATION_CODE,
                org.springframework.security.oauth2.core.AuthorizationGrantType.REFRESH_TOKEN,
                org.springframework.security.oauth2.core.AuthorizationGrantType.CLIENT_CREDENTIALS
        ));
        assertThat(client.getRedirectUris()).contains("http://127.0.0.1:8080/login/oauth2/code/gateway-client");
        assertThat(client.getScopes()).containsAll(Set.of("openid", "profile", "workouts.read", "workouts.write"));
    }

    @Test
    void contextLoads() {
        // Basic test to ensure the Spring application context loads successfully.
    }
}
