package za.co.user.service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Collection;
import java.util.Date;
import java.util.List;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:3600000}")
    private long jwtExpiration;

    public String generateToken(String securityKey, String email) {
        return generateToken(email, List.of());
    }

    public String generateToken(String subject, Collection<? extends GrantedAuthority> authorities) {
        SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;
        Date issuedAt = new Date(System.currentTimeMillis());
        Date expirationTime = new Date(System.currentTimeMillis() + jwtExpiration);

        List<String> roles = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(issuedAt)
                .setExpiration(expirationTime)
                .setIssuer("NovaFlow User Service")
                .claim("roles", roles)
                .signWith(signingKey(), signatureAlgorithm)
                .compact();
    }

    public String getEmailFromToken(String token) {
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    private Key signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
