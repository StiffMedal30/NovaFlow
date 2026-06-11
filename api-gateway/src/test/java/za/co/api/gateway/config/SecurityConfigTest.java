package za.co.api.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import za.co.api.gateway.util.JwtTokenFilter;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

//@SpringBootTest
class SecurityConfigTest {

    @Autowired
    private SecurityConfig securityConfig;

    @Autowired
    private JwtTokenFilter jwtTokenFilter;

//    @Test
    void testSecurityFilterChain() throws Exception {
        HttpSecurity http = mock(HttpSecurity.class);
        SecurityFilterChain filterChain = securityConfig.securityFilterChain(http);

        assertNotNull(filterChain);
    }
}