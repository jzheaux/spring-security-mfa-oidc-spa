package com.example.authserver;

import java.util.function.Supplier;

import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

class AuthenticatedByAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private final Class<? extends Authentication> authenticationClass;

    public AuthenticatedByAuthorizationManager(Class<? extends Authentication> authenticationClass) {
        this.authenticationClass = authenticationClass;
    }

    static AuthenticatedByAuthorizationManager needs(Class<? extends Authentication> authenticationClass) {
        return new AuthenticatedByAuthorizationManager(authenticationClass);
    }

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, RequestAuthorizationContext object) {
        return new TypeAuthorizationDecision(this.authenticationClass.isAssignableFrom(authentication.get()
            .getClass()));
    }

    public final class TypeAuthorizationDecision extends AuthorizationDecision {

        private TypeAuthorizationDecision(boolean granted) {
            super(granted);
        }

        public Class<? extends Authentication> getAuthenticationClass() {
            return AuthenticatedByAuthorizationManager.this.authenticationClass;
        }
    }
}
