package com.ecommerce.admin.service;

import com.ecommerce.admin.dto.AdminAuthDTO;
import com.ecommerce.admin.entity.AdminUser;
import com.ecommerce.admin.repository.AdminUserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class AdminAuthService {

    private static final String ADMIN_IDENTITY_TYPE = "ADMIN";
    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid admin credentials";

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String jwtSecret;
    private final long jwtExpiration;

    public AdminAuthService(
            AdminUserRepository adminUserRepository,
            @Value("${admin.jwt.secret}") String jwtSecret,
            @Value("${admin.jwt.expiration}") long jwtExpiration
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtSecret = jwtSecret;
        this.jwtExpiration = jwtExpiration;
    }

    public AdminAuthDTO.LoginResponse login(AdminAuthDTO.LoginRequest request) {
        AdminUser admin = adminUserRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(this::invalidCredentials);

        if (!admin.isActive() || !passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw invalidCredentials();
        }

        return new AdminAuthDTO.LoginResponse(
                generateToken(admin),
                "Bearer",
                admin.getId(),
                admin.getEmail(),
                admin.getName()
        );
    }

    private String generateToken(AdminUser admin) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(admin.getId().toString())
                .claim("email", admin.getEmail())
                .claim("type", ADMIN_IDENTITY_TYPE)
                .issuedAt(new Date(now))
                .expiration(new Date(now + jwtExpiration))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)))
                .compact();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private IllegalArgumentException invalidCredentials() {
        return new IllegalArgumentException(INVALID_CREDENTIALS_MESSAGE);
    }
}
