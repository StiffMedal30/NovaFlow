package za.co.user.service.service;

import za.co.user.service.entity.AppUserEntity;
import za.co.user.service.enums.ActivationStatus;

public interface AccountActivationService {

    String issueToken(AppUserEntity user);

    boolean hasUsableToken(AppUserEntity user);

    ActivationStatus activate(String token);
}
