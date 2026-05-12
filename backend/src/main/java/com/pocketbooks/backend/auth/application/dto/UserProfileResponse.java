package com.pocketbooks.backend.auth.application.dto;

public class UserProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private Double monthlyBudget;
    private String institution;
    private String displayCurrency;
    private Double balance;

    public UserProfileResponse(Long id, String fullName, String email, Double monthlyBudget,
                               String institution, String displayCurrency, Double balance) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.monthlyBudget = monthlyBudget;
        this.institution = institution;
        this.displayCurrency = displayCurrency;
        this.balance = balance;
    }

    // Getters
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public Double getMonthlyBudget() { return monthlyBudget; }
    public String getInstitution() { return institution; }
    public String getDisplayCurrency() { return displayCurrency; }
    public Double getBalance() { return balance; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setEmail(String email) { this.email = email; }
    public void setMonthlyBudget(Double monthlyBudget) { this.monthlyBudget = monthlyBudget; }
    public void setInstitution(String institution) { this.institution = institution; }
    public void setDisplayCurrency(String displayCurrency) { this.displayCurrency = displayCurrency; }
    public void setBalance(Double balance) { this.balance = balance; }
}
