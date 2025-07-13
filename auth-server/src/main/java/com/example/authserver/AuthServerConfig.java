package com.example.authserver;

import static com.example.authserver.AuthenticatedByAuthorizationManager.needs;

import java.util.Map;
import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.ott.OneTimeTokenAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.oidc.authentication.OidcUserInfoAuthenticationToken;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.util.StringUtils;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

@Configuration
@EnableWebSecurity
class AuthServerConfig {

    @Bean
    @Order(1)
    SecurityFilterChain oauth2EndpointSecurity(HttpSecurity http) throws Exception {
        var authz = OAuth2AuthorizationServerConfigurer.authorizationServer().oidc((oidc) -> oidc
            .userInfoEndpoint((userInfo) -> userInfo
                .userInfoMapper((mapper) -> {
                    OidcUserInfoAuthenticationToken token = mapper.getAuthentication();
                    return new OidcUserInfo(Map.of(
                        "sub", token.getName(),
                        "given_name", StringUtils.capitalize(token.getName())
                    ));
                })
            )
        );

        http
            .securityMatcher(authz.getEndpointsMatcher())
            .with(authz, Customizer.withDefaults())
            .authorizeHttpRequests((authorize) -> authorize.anyRequest().authenticated())
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login"))
            )
            .oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain appEndpointSecurity(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/error", "/login").permitAll()
                .requestMatchers("/ott/**").access(needs(UsernamePasswordAuthenticationToken.class))
                .anyRequest().access(needs(OneTimeTokenAuthenticationToken.class))
            )
            .oauth2ResourceServer((oauth2) -> oauth2.jwt(Customizer.withDefaults()))
            .httpBasic(Customizer.withDefaults())
            .formLogin(Customizer.withDefaults())
            .oneTimeTokenLogin((ott) -> ott.loginPage("/ott"))
            .with(new MfaConfigurer(), Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService users() {
        PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        UserDetails declan = User.builder()
            .username("declan")
            .password(passwordEncoder.encode("password"))
            .authorities("workout:read")
            .build();
        UserDetails admin = User.builder()
            .username("admin")
            .password(passwordEncoder.encode("password"))
            .authorities("app:admin")
            .build();
        return new InMemoryUserDetailsManager(declan, admin);
    }

    @Bean
    RegisteredClientRepository clients() {
        PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        RegisteredClient registeredClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("gateway-client")
            .clientSecret(passwordEncoder.encode("secret"))
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
            .redirectUri("https://gateway.127.0.0.1.nip.io:9443/login/oauth2/code/gateway-client-oidc")
            .scope(OidcScopes.OPENID)
            .scope(OidcScopes.PROFILE)
            .scope("workouts:read")
            .scope("workouts:write")
            .clientSettings(ClientSettings.builder().requireAuthorizationConsent(true).build())
            .build();
        return new InMemoryRegisteredClientRepository(registeredClient);
    }

    @Bean
    JWKSource<SecurityContext> jwks() throws JOSEException {
        RSAKeyGenerator generator = new RSAKeyGenerator(2048);
        RSAKey key = generator.keyID(UUID.randomUUID().toString()).generate();
        return new ImmutableJWKSet<>(new JWKSet(key));
    }

    @Bean
    JwtEncoder encoder(JWKSource<SecurityContext> source) {
        return new NimbusJwtEncoder(source);
    }

    @Bean
    AuthorizationServerSettings settings() {
        return AuthorizationServerSettings.builder().build();
    }

    private static class MfaConfigurer extends AbstractHttpConfigurer<MfaConfigurer, HttpSecurity> {
        @Override
        public void init(HttpSecurity http) throws Exception {
            RequestCache cache = http.getSharedObject(RequestCache.class);
            AuthenticatedByAccessDeniedHandler handler =
                new AuthenticatedByAccessDeniedHandler(cache);
            http.exceptionHandling(exceptions -> exceptions.accessDeniedHandler(handler));

        }
    }
}
