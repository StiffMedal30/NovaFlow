package za.co.user.service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    private static final String USER_SUBJECT_HEADER = "X-User-Subject";
    private static final String USER_ROLES_HEADER = "X-User-Roles";
    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String subject = request.getHeader(USER_SUBJECT_HEADER);
        if (subject != null
                && !subject.isBlank()
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            List<GrantedAuthority> authorities = extractAuthorities(request.getHeader(USER_ROLES_HEADER));
            User userDetails = new User(subject, "", authorities);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private List<GrantedAuthority> extractAuthorities(String rolesHeader) {
        if (rolesHeader == null || rolesHeader.isBlank()) {
            return List.of(new SimpleGrantedAuthority("ROLE_AUTHENTICATED"));
        }

        return Arrays.stream(rolesHeader.split(","))
                .map(this::normalizeAuthority)
                .filter(role -> !role.isBlank())
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();
    }

    private String normalizeAuthority(String role) {
        String trimmed = role.trim();
        if (trimmed.isBlank()) {
            return "";
        }

        String upper = trimmed.toUpperCase(Locale.ROOT);
        return upper.startsWith(ROLE_PREFIX) ? upper : ROLE_PREFIX + upper;
    }
}
