package com.pocketbooks.backend.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    // Build the signing key from the secret string
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // Generate a JWT token for the given email
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)                          // 0.12.x — was .setSubject()
                .issuedAt(new Date())                    // 0.12.x — was .setIssuedAt()
                .expiration(new Date(System.currentTimeMillis() + expiration)) // was .setExpiration()
                .signWith(getSigningKey())               // 0.12.x — no need to pass algorithm
                .compact();
    }

    // Extract the email (subject) from a JWT token
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    // Check if the token is still valid (not expired, not malformed)
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // Parse and return the claims body from the token
    private Claims parseClaims(String token) {
        return Jwts.parser()                             // 0.12.x — was .parserBuilder()
                .verifyWith(getSigningKey())             // 0.12.x — was .setSigningKey()
                .build()
                .parseSignedClaims(token)               // 0.12.x — was .parseClaimsJws()
                .getPayload();                          // 0.12.x — was .getBody()
    }
}