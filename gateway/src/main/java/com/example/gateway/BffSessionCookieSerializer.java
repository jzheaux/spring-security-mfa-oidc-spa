package com.example.gateway;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.stereotype.Component;

@Component
public class BffSessionCookieSerializer implements CookieSerializer {
    
    private final CookieSerializer defaults = createCookieSerializer();

    private DefaultCookieSerializer createCookieSerializer() {
        DefaultCookieSerializer defaults = new DefaultCookieSerializer();
        defaults.setCookieName("__Host-SESSION");
        defaults.setUseSecureCookie(true);
        defaults.setSameSite("None");
        return defaults;
    }

    @Override
    public void writeCookieValue(CookieValue cookieValue) {
        Authentication authentication = SecurityContextHolder.getContext()
            .getAuthentication();
        if (authentication == null) {
            defaults.writeCookieValue(cookieValue);
        } else {
            DefaultCookieSerializer postAuthentication = createCookieSerializer();
            postAuthentication.setSameSite("Strict");
            postAuthentication.writeCookieValue(cookieValue);
        }
    }

    @Override
    public List<String> readCookieValues(HttpServletRequest request) {
        return this.defaults.readCookieValues(request);
    }
    
}
