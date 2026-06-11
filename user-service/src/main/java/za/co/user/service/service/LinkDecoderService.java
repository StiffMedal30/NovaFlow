package za.co.user.service.service;

public interface LinkDecoderService {
    String decode(String token);
    String encode(String url);
}
