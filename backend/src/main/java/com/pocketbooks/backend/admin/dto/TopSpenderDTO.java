package com.pocketbooks.backend.admin.dto;

public class TopSpenderDTO {
    private String fullName;
    private String email;
    private Double totalSpent;

    public TopSpenderDTO(String fullName, String email, Double totalSpent) {
        this.fullName = fullName;
        this.email = email;
        this.totalSpent = totalSpent;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(Double totalSpent) { this.totalSpent = totalSpent; }
}
