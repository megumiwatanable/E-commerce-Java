package com.ecommerce.gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${admin.jwt.secret}")
    private String adminJwtSecret;

    @Value("${gateway.internal-secret}")
    private String gatewayInternalSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Browser preflight requests do not include the Authorization header.
        if (request.getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        // Public requests may omit JWT. If a token is present, still parse it so
        // downstream services receive the authenticated user's identity.
        if ((authHeader == null || !authHeader.startsWith("Bearer ")) && isPublicRequest(request)) {
            return chain.filter(exchange);
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorizedResponse(exchange, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = parseToken(token);
            String userId = claims.getSubject();
            String email = claims.get("email", String.class);
            String identityType = claims.get("type", String.class);

            if (isAdminRequest(request) && !"ADMIN".equals(identityType)) {
                return errorResponse(exchange, HttpStatus.FORBIDDEN, "Administrator access required");
            }
            if (!isAdminRequest(request) && !isPublicRequest(request) && !"CUSTOMER".equals(identityType)) {
                return errorResponse(exchange, HttpStatus.FORBIDDEN, "Customer access required");
            }

            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Id", userId)
                    .header("X-User-Email", email)
                    .header("X-Identity-Type", identityType)
                    .header("X-Gateway-Secret", gatewayInternalSecret)
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (Exception e) {
            logger.error("JWT validation failed: {}", e.getMessage());
            return unauthorizedResponse(exchange, "Invalid or expired token");
        }
    }

    private boolean isPublicRequest(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();
        if (path.equals("/api/auth/login") || path.equals("/api/auth/register")) return true;
        if (method == HttpMethod.POST && path.equals("/api/admin/auth/login")) return true;
        if (method == HttpMethod.GET && (path.startsWith("/api/products") || path.startsWith("/api/categories"))) return true;
        if (method == HttpMethod.GET && (path.matches("^/api/inventory/\\d+$") || path.startsWith("/api/inventory/check/"))) return true;
        if (method == HttpMethod.GET && path.startsWith("/api/orders/guest/")) return true;
        if (method == HttpMethod.POST && path.equals("/api/checkout/place-order")) return true;
        return path.startsWith("/actuator") || path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs");
    }

    private Claims parseToken(String token) {
        try {
            return parseToken(token, jwtSecret);
        } catch (Exception customerTokenFailure) {
            return parseToken(token, adminJwtSecret);
        }
    }

    private Claims parseToken(String token, String secret) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    private boolean isAdminRequest(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();
        if (path.startsWith("/api/admin/")) return true;
        if (path.equals("/api/users")) return true;
        if (path.matches("^/api/users/\\d+(/admin)?$")) return true;
        if (path.equals("/api/inventory") || path.startsWith("/api/inventory/low-stock")) return true;
        if (method != HttpMethod.GET && (path.startsWith("/api/products")
                || path.startsWith("/api/categories") || path.startsWith("/api/inventory"))) return true;
        if (path.equals("/api/orders") || path.equals("/api/orders/stats")) return true;
        if (method == HttpMethod.PUT && path.matches("^/api/orders/\\d+/status$")) return true;
        return path.equals("/api/payments") || path.equals("/api/payments/stats");
    }

    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String message) {
        return errorResponse(exchange, HttpStatus.UNAUTHORIZED, message);
    }

    private Mono<Void> errorResponse(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = String.format(
                "{\"success\":false,\"message\":\"%s\",\"errorCode\":\"%s\",\"timestamp\":\"%s\"}",
                message, status == HttpStatus.FORBIDDEN ? "FORBIDDEN" : "UNAUTHORIZED", java.time.Instant.now()
        );
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes());
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
