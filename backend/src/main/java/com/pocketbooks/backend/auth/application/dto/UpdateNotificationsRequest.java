package com.pocketbooks.backend.auth.application.dto;

public class UpdateNotificationsRequest {
    private Boolean emailReceipts;
    private Boolean expenseAlerts;
    private Boolean weeklySummary;
    private Boolean loginAlerts;

    public UpdateNotificationsRequest() {}

    public UpdateNotificationsRequest(Boolean emailReceipts, Boolean expenseAlerts,
                                     Boolean weeklySummary, Boolean loginAlerts) {
        this.emailReceipts = emailReceipts;
        this.expenseAlerts = expenseAlerts;
        this.weeklySummary = weeklySummary;
        this.loginAlerts = loginAlerts;
    }

    // Getters
    public Boolean getEmailReceipts() { return emailReceipts; }
    public Boolean getExpenseAlerts() { return expenseAlerts; }
    public Boolean getWeeklySummary() { return weeklySummary; }
    public Boolean getLoginAlerts() { return loginAlerts; }

    // Setters
    public void setEmailReceipts(Boolean emailReceipts) { this.emailReceipts = emailReceipts; }
    public void setExpenseAlerts(Boolean expenseAlerts) { this.expenseAlerts = expenseAlerts; }
    public void setWeeklySummary(Boolean weeklySummary) { this.weeklySummary = weeklySummary; }
    public void setLoginAlerts(Boolean loginAlerts) { this.loginAlerts = loginAlerts; }
}
