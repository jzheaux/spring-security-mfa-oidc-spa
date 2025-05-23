 package com.example.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
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
   
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
