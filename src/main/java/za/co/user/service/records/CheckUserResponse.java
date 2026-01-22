package za.co.user.service.records;

public record CheckUserResponse(
    boolean valid,           
    String email,
    String username,
    boolean emailTaken,      
    boolean usernameTaken,   
    String message          
) {
}