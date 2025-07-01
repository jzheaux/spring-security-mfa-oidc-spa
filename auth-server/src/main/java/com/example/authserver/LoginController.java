package com.example.authserver;

import java.time.Instant;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
class LoginController {

    @Autowired
    JwtEncoder encoder;

    @GetMapping("/login")
    String loginPage() {
        return "login";
    }

    @GetMapping("/user")
    @ResponseBody
    Map<String, String> user(Authentication authentication) {
        return Map.of("sub", authentication.getName());
    }

    @GetMapping(value = "/token")
    @ResponseBody
    String token(Authentication authentication) {
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .subject(authentication.getName())
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .claim("scp", AuthorityUtils.authorityListToSet(authentication.getAuthorities()))
            .build();
        return this.encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    @GetMapping("/ott")
    String ott(Model model, Authentication authentication) {
        model.addAttribute("username", authentication.getName());
        return "ott";
    }

    @GetMapping("/ott/sent")
    String ottSent() {
        return "ott-sent";
    }

    @GetMapping("/webauthn")
    String webauthn(Model model, CsrfToken csrf) {
        model.addAttribute("csrf", csrf.getToken());
        return "webauthn-authenticate";
    }

    @GetMapping("/authorize")
    String authorizeRequest(Authentication authentication) {
        return "forward:/oauth2/authorize";
    }
}
