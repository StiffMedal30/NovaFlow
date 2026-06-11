package za.co.api.gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import za.co.api.gateway.config.SecurityPaths;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ROLES_CLAIM = "roles";
    private static final String ROLE_PREFIX = "ROLE_";

    @Value("${jwt.secret}")
    private String secret;

    public String getSECRET() {
        return secret;
    }

    public void setSECRET(String secret) {
        this.secret = secret;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return SecurityPaths.isPublicRequest(request);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String token = getJwtTokenFromRequest(request);
        if (token == null) {
            unauthorized(response, "Missing bearer token");
            return;
        }

        try {
            Claims claims = getClaimsFromToken(token);
            String username = claims.getSubject();
            if (username == null || username.isBlank()) {
                unauthorized(response, "Invalid token subject");
                return;
            }

            logger.debug("Authenticated user: {}", username);

            List<GrantedAuthority> authorities = extractAuthorities(claims);
            UserDetails userDetails = new User(username, "", authorities);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            filterChain.doFilter(request, response);

        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
            logger.warn("JWT validation failed: {}", e.getMessage());
            unauthorized(response, "Invalid or expired token");
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            logger.error("Unexpected error in JWT filter: {}", e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"An error occurred while processing the token\"}");
        }
    }

    private String getJwtTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    private Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    private List<GrantedAuthority> extractAuthorities(Claims claims) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_AUTHENTICATED"));

        Object rolesClaim = claims.get(ROLES_CLAIM);
        if (rolesClaim instanceof Collection<?> roles) {
            roles.stream()
                    .filter(Objects::nonNull)
                    .map(String::valueOf)
                    .map(this::normalizeAuthority)
                    .distinct()
                    .map(SimpleGrantedAuthority::new)
                    .forEach(authorities::add);
        } else if (rolesClaim instanceof String roles) {
            for (String role : roles.split(",")) {
                String authority = normalizeAuthority(role);
                if (!authority.isBlank()) {
                    authorities.add(new SimpleGrantedAuthority(authority));
                }
            }
        }

        return authorities.stream().distinct().toList();
    }

    private String normalizeAuthority(String role) {
        String trimmed = role.trim();
        if (trimmed.isBlank()) {
            return "";
        }

        String upper = trimmed.toUpperCase(Locale.ROOT);
        return upper.startsWith(ROLE_PREFIX) ? upper : ROLE_PREFIX + upper;
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    public String getEmail() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return null;
    }
}
