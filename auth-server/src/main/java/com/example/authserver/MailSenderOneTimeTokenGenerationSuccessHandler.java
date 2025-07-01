package com.example.authserver;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.ott.OneTimeToken;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.authentication.ott.OneTimeTokenGenerationSuccessHandler;
import org.springframework.security.web.util.UrlUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class MailSenderOneTimeTokenGenerationSuccessHandler implements OneTimeTokenGenerationSuccessHandler {

    private final JavaMailSender mailSender; // Needs JavaMailSender bean
    private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();

    public MailSenderOneTimeTokenGenerationSuccessHandler(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, OneTimeToken oneTimeToken)
        throws IOException, ServletException {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@example.org");
        message.setTo("josh@example.org"); // Example email address
        message.setSubject("Your One-Time Token");
        message.setText("Here is your one-time token: " + oneTimeToken.getTokenValue());
        this.mailSender.send(message);
        this.redirectStrategy.sendRedirect(request, response, "/ott/sent");
    }
}
