package com.pocketbooks.backend.auth.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private Double amountPhp;

    @Column(nullable = false)
    private String expenseDate;

    @Column(columnDefinition = "text")
    private String notes;

    private String receiptName;

    private Integer receiptSize;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Expense() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Double getAmountPhp() { return amountPhp; }
    public void setAmountPhp(Double amountPhp) { this.amountPhp = amountPhp; }
    public String getExpenseDate() { return expenseDate; }
    public void setExpenseDate(String expenseDate) { this.expenseDate = expenseDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getReceiptName() { return receiptName; }
    public void setReceiptName(String receiptName) { this.receiptName = receiptName; }
    public Integer getReceiptSize() { return receiptSize; }
    public void setReceiptSize(Integer receiptSize) { this.receiptSize = receiptSize; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
