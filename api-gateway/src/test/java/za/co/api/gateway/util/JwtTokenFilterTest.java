package za.co.api.gateway.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class JwtTokenFilterTest {

    private static final String SECRET = "m0Y%3jF1s9d7@Lz8qWeR!8u6TxCvBnMzm0Y%3jF1s9d7@Lz8qWeR!8u6TxCvBnMz";

    private JwtTokenFilter jwtTokenFilter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        jwtTokenFilter = new JwtTokenFilter();
        jwtTokenFilter.setSECRET(SECRET);
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = mock(FilterChain.class);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testShouldNotFilter() {
        request.setServletPath("/api/user/login");
        assertTrue(jwtTokenFilter.shouldNotFilter(request));

        request.setServletPath("/api/user/register");
        assertTrue(jwtTokenFilter.shouldNotFilter(request));

        request.setServletPath("/api/user/password/reset");
        assertTrue(jwtTokenFilter.shouldNotFilter(request));

        request.setServletPath("/api/idea/add");
        assertFalse(jwtTokenFilter.shouldNotFilter(request));
    }

    @Test
    void testDoFilterInternalWithValidToken() throws Exception {
        String token = Jwts.builder()
                .setSubject("test-user")
                .claim("roles", List.of("ROLE_ADMIN"))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);

        jwtTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals("test-user", SecurityContextHolder.getContext().getAuthentication().getName());
        assertTrue(SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority())));
    }

    @Test
    void testDoFilterInternalWithInvalidToken() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer invalid-token");

        jwtTokenFilter.doFilterInternal(request, response, filterChain);

        assertEquals(401, response.getStatus());
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalWithMissingToken() throws Exception {
        jwtTokenFilter.doFilterInternal(request, response, filterChain);

        assertEquals(401, response.getStatus());
        verify(filterChain, never()).doFilter(request, response);
    }

    private Key getKey() {
        return Keys.hmacShaKeyFor(jwtTokenFilter.getSECRET().getBytes(StandardCharsets.UTF_8));
    }
}
