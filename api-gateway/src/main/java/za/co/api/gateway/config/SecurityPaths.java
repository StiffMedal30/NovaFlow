package za.co.api.gateway.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;
import org.springframework.util.AntPathMatcher;

public final class SecurityPaths {

    public static final String[] PUBLIC_PATHS = {
            "/api/user/login",
            "/api/user/register",
            "/api/user/password/reset",
            "/api/link",
            "/api/debug/mappings",
            "/api/user/check-registered",
            "/error/**"
    };

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    private SecurityPaths() {
    }

    public static boolean isPublicRequest(HttpServletRequest request) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String path = request.getServletPath();
        for (String publicPath : PUBLIC_PATHS) {
            if (PATH_MATCHER.match(publicPath, path)) {
                return true;
            }
        }
        return false;
    }
}
