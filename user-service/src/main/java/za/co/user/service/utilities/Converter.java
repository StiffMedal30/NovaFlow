package za.co.user.service.utilities;

import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

public class Converter {
    public static <T> T optionalToEntity(Optional<T> optional) {
        return optional.orElseThrow(() -> new UsernameNotFoundException("Entity not found"));
    }
}
