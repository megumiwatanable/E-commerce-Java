package com.ecommerce.admin.dto;
import jakarta.validation.constraints.*;
public class AdminAuthDTO {
 public static class LoginRequest { @NotBlank @Email private String email; @NotBlank private String password; public String getEmail(){return email;} public void setEmail(String v){email=v;} public String getPassword(){return password;} public void setPassword(String v){password=v;} }
 public record LoginResponse(String token,String type,Long adminId,String email,String name){}
 public record ApiResponse<T>(boolean success,String message,T data){public static <T> ApiResponse<T> ok(String m,T d){return new ApiResponse<>(true,m,d);}}
}
