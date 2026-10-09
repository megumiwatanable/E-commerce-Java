package com.ecommerce.admin.service;
import com.ecommerce.admin.dto.AdminAuthDTO;
import com.ecommerce.admin.entity.AdminUser;
import com.ecommerce.admin.repository.AdminUserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Date;
@Service
public class AdminAuthService {
 private final AdminUserRepository repository; private final BCryptPasswordEncoder encoder=new BCryptPasswordEncoder();
 @Value("${admin.jwt.secret}") private String secret; @Value("${admin.jwt.expiration}") private long expiration;
 public AdminAuthService(AdminUserRepository r){repository=r;}
 public AdminAuthDTO.LoginResponse login(AdminAuthDTO.LoginRequest request){AdminUser admin=repository.findByEmail(request.getEmail().trim().toLowerCase()).orElseThrow(()->new IllegalArgumentException("Invalid admin credentials"));if(!admin.isActive()||!encoder.matches(request.getPassword(),admin.getPassword()))throw new IllegalArgumentException("Invalid admin credentials");String token=Jwts.builder().subject(admin.getId().toString()).claim("email",admin.getEmail()).claim("type","ADMIN").issuedAt(new Date()).expiration(new Date(System.currentTimeMillis()+expiration)).signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret))).compact();return new AdminAuthDTO.LoginResponse(token,"Bearer",admin.getId(),admin.getEmail(),admin.getName());}
}
