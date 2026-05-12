package com.pocketbooks.backend.auth.application.dto;

public class UpdateProfileRequest {
    private String fullName;
    private String email;
    private Double monthlyBudget;
    private String institution;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String fullName, String email, Double monthlyBudget, String institution) {
        this.fullName = fullName;
        this.email = email;
        this.monthlyBudget = monthlyBudget;
        this.institution = institution;
    }

    // Getters
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public Double getMonthlyBudget() { return monthlyBudget; }
    public String getInstitution() { return institution; }

    // Setters
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setEmail(String email) { this.email = email; }
    public void setMonthlyBudget(Double monthlyBudget) { this.monthlyBudget = monthlyBudget; }
    public void setInstitution(String institution) { this.institution = institution; }
}
