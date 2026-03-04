package com.pocketbooks.backend.dto;

import jakarta.validation.constraints.*;

public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    public LoginRequest() {}

    public String getEmail()    { return email; }
    public String getPassword() { return password; }

    public void setEmail(String email)       { this.email = email; }
    public void setPassword(String password) { this.password = password; }
}