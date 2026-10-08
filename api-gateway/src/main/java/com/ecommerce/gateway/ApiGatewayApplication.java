package com.ecommerce.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("user-service", r -> r
                        .path("/api/auth/**", "/api/users/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://user-service:8081"))
                .route("product-service", r -> r
                        .path("/api/products/**", "/api/categories/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://product-service:8082"))
                .route("inventory-service", r -> r
                        .path("/api/inventory/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://inventory-service:8083"))
                .route("order-service-cart", r -> r
                        .path("/api/cart/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://order-service:8084"))
                .route("order-service-orders", r -> r
                        .path("/api/orders/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://order-service:8084"))
                .route("payment-service", r -> r
                        .path("/api/payments/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://payment-service:8085"))
                .route("notification-service", r -> r
                        .path("/api/notifications/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://notification-service:8086"))
                .build();
    }
}
