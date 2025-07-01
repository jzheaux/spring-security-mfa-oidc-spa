package com.example.gateway;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.stereotype.Component;

@Component
public class BffSessionCookieSerializer implements CookieSerializer {
    
    private final CookieSerializer defaults = createCookieSerializer();

    private DefaultCookieSerializer createCookieSerializer() {
        DefaultCookieSerializer defaults = new DefaultCookieSerializer();
        defaults.setCookieName("SESSION");
        defaults.setUseSecureCookie(true);
        defaults.setSameSite("None");
        return defaults;
    }

    @Override
    public void writeCookieValue(CookieValue cookieValue) {
        defaults.writeCookieValue(cookieValue);
    }

    @Override
    public List<String> readCookieValues(HttpServletRequest request) {
        return this.defaults.readCookieValues(request);
    }
    
}
