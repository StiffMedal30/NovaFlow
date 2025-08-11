package za.co.user.service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String JWT_SECRET;

    // Method to generate JWT token
    public String generateToken(String securityKey, String email) {
        System.out.println("JWT SECRET = " + JWT_SECRET);
        SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;
        Date issuedAt = new Date(System.currentTimeMillis());
        Date expirationTime = new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10); // 10 hours

        // Use UTF-8 encoded bytes directly instead of base64-decoding
        Key signingKey = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(issuedAt)
                .setExpiration(expirationTime)
                .signWith(signingKey, signatureAlgorithm)
                .setIssuer("User Service")
                .compact();
    }

    public String getEmailFromToken(String token) {
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            Key signingKey = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getSubject();
        } catch (Exception e) {
            return e.getMessage();
        }
    }
}
