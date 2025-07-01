package com.example.authserver;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.ott.OneTimeTokenAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.webauthn.authentication.WebAuthnAuthentication;

import com.example.authserver.AuthenticatedByAuthorizationManager.TypeAuthorizationDecision;

class AuthenticatedByAccessDeniedHandler implements AccessDeniedHandler {
    private final AccessDeniedHandler delegate = new AccessDeniedHandlerImpl();
    private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();
    private final RequestCache cache;

    public AuthenticatedByAccessDeniedHandler(RequestCache cache) {
        this.cache = cache;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException exception) throws IOException, ServletException {
        Class<? extends Authentication> needed = neededAuthentication(exception);
        if (needed == null) {
            this.delegate.handle(request, response, exception);
            return;
        }
        if (OneTimeTokenAuthenticationToken.class.isAssignableFrom(needed)) {
            this.cache.saveRequest(request, response);
            this.redirectStrategy.sendRedirect(request, response, "/ott");
            return;
        }
        if (WebAuthnAuthentication.class.isAssignableFrom(neededAuthentication(exception))) {
            this.cache.saveRequest(request, response);
            this.redirectStrategy.sendRedirect(request, response, "/webauthn");
            return;
        }
        this.delegate.handle(request, response, exception);
    }

    private Class<? extends Authentication> neededAuthentication(AccessDeniedException exception) {
        if (!(exception instanceof AuthorizationDeniedException authz)) {
            return null;
        }
        if (!(authz.getAuthorizationResult() instanceof TypeAuthorizationDecision decision)) {
            return null;
        }
        return decision.getAuthenticationClass();
    }
}