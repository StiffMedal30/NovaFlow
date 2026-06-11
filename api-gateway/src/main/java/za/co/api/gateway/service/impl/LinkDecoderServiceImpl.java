package za.co.api.gateway.service.impl;

import org.springframework.stereotype.Service;
import za.co.api.gateway.service.LinkDecoderService;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class LinkDecoderServiceImpl implements LinkDecoderService {

    @Override
    public String decode(String token) {
        byte[] decodedBytes = Base64.getUrlDecoder().decode(token);
        return new String(decodedBytes, StandardCharsets.UTF_8);
    }
}
