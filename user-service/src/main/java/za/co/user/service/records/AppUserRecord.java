package za.co.user.service.records;

import za.co.user.service.enums.Role;


public record AppUserRecord(
        Long id,
        String username,
        String password,
        String email,
        String name,
        Role role,
        String adminUsername,
        String ideaName
) {
}
