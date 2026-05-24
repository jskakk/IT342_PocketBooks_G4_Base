package com.pocketbooks.backend.admin.dto;

import java.util.List;

public class AdminStatsDTO {
    private Long totalUsers;
    private Long totalExpenses;
    private Double totalFunded;
    private Integer activeTransactions;
    private List<TopSpenderDTO> topSpenders;
    private List<RecentSignupDTO> recentSignups;

    public AdminStatsDTO(Long totalUsers, Long totalExpenses, Double totalFunded,
                        Integer activeTransactions, List<TopSpenderDTO> topSpenders,
                        List<RecentSignupDTO> recentSignups) {
        this.totalUsers = totalUsers;
        this.totalExpenses = totalExpenses;
        this.totalFunded = totalFunded;
        this.activeTransactions = activeTransactions;
        this.topSpenders = topSpenders;
        this.recentSignups = recentSignups;
    }

    public Long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(Long totalUsers) { this.totalUsers = totalUsers; }

    public Long getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(Long totalExpenses) { this.totalExpenses = totalExpenses; }

    public Double getTotalFunded() { return totalFunded; }
    public void setTotalFunded(Double totalFunded) { this.totalFunded = totalFunded; }

    public Integer getActiveTransactions() { return activeTransactions; }
    public void setActiveTransactions(Integer activeTransactions) { this.activeTransactions = activeTransactions; }

    public List<TopSpenderDTO> getTopSpenders() { return topSpenders; }
    public void setTopSpenders(List<TopSpenderDTO> topSpenders) { this.topSpenders = topSpenders; }

    public List<RecentSignupDTO> getRecentSignups() { return recentSignups; }
    public void setRecentSignups(List<RecentSignupDTO> recentSignups) { this.recentSignups = recentSignups; }
}
