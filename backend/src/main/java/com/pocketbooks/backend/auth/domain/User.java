package com.pocketbooks.backend.auth.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(nullable = false)
    private Double balance = 0.0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        ROLE_STUDENT, ROLE_ADMIN
    }

    // ── Constructors ────────────────────────────────────────────
    public User() {}

    public User(String fullName, String email, String passwordHash, Role role) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.balance = 0.0;
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters ─────────────────────────────────────────────────
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public Double getBalance() { return balance; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // ── Setters ─────────────────────────────────────────────────
    public void setId(Long id) { this.id = id; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setRole(Role role) { this.role = role; }
    public void setBalance(Double balance) { this.balance = balance; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}