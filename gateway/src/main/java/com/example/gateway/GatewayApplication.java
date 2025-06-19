 package com.example.gateway;

 import javax.net.ssl.SSLContext;

 import org.apache.hc.client5.http.impl.classic.HttpClients;
 import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
 import org.apache.hc.client5.http.ssl.DefaultClientTlsStrategy;
 import org.apache.hc.core5.ssl.SSLContexts;
 import org.springframework.boot.SpringApplication;
 import org.springframework.boot.autoconfigure.SpringBootApplication;
 import org.springframework.boot.web.client.RestClientCustomizer;
 import org.springframework.context.annotation.Bean;
 import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
 import org.springframework.stereotype.Controller;
 import org.springframework.web.bind.annotation.GetMapping;

@SpringBootApplication
class GatewayApplication {
    @Controller
    static class HomeContoller {
        @GetMapping
        String home() {
            return "redirect:index.html";
        }
    }
   
    @Bean
    RestClientCustomizer tls() throws Exception {
        SSLContext sslContext = SSLContexts.custom()
            .build();

        var connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setTlsSocketStrategy(new DefaultClientTlsStrategy(sslContext))
                .build();

        var httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .build();

        return (rest) -> {
            rest.requestFactory(new HttpComponentsClientHttpRequestFactory(httpClient));
        };
    }

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
