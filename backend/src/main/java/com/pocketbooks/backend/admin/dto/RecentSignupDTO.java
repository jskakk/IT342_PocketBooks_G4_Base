package com.pocketbooks.backend.admin.dto;

public class RecentSignupDTO {
    private String fullName;
    private String email;
    private String createdAt;

    public RecentSignupDTO(String fullName, String email, String createdAt) {
        this.fullName = fullName;
        this.email = email;
        this.createdAt = createdAt;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
