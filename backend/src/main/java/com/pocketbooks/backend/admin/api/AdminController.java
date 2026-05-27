package com.pocketbooks.backend.admin.api;

import com.pocketbooks.backend.admin.application.AdminService;
import com.pocketbooks.backend.admin.dto.AdminStatsDTO;
import com.pocketbooks.backend.admin.dto.UserDTO;
import com.pocketbooks.backend.auth.domain.Expense;
import com.pocketbooks.backend.auth.domain.ExpenseRepository;
import com.pocketbooks.backend.auth.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @Autowired
    public AdminController(AdminService adminService, ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.adminService = adminService;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String newRole = request.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        adminService.updateUserRole(id, newRole.trim());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/expenses")
    public ResponseEntity<List<Map<String, Object>>> getAllExpenses() {
        List<Map<String, Object>> expenses = expenseRepository.findAll().stream()
            .sorted(Comparator.comparing(Expense::getCreatedAt).reversed())
            .map(expense -> {
                Optional<String> userName = userRepository.findByEmail(expense.getUserId())
                    .map(user -> user.getFullName());

                Map<String, Object> row = new HashMap<>();
                row.put("id", expense.getId());
                row.put("userId", expense.getUserId());
                row.put("userName", userName.orElse(expense.getUserId()));
                row.put("description", expense.getTitle());
                row.put("category", expense.getCategory());
                row.put("amount", expense.getAmount() == null ? 0.0 : expense.getAmount());
                row.put("date", expense.getExpenseDate() == null ? "" : expense.getExpenseDate());
                row.put("createdAt", expense.getCreatedAt() == null ? "" : expense.getCreatedAt().toString());
                return row;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(expenses);
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<Map<String, String>> deleteExpense(@PathVariable String id) {
        Expense expense = expenseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Expense not found with ID: " + id));

        userRepository.findByEmail(expense.getUserId()).ifPresent(user -> {
            double currentBalance = user.getBalance() == null ? 0.0 : user.getBalance();
            double refundAmount = expense.getAmountPhp() == null ? expense.getAmount() : expense.getAmountPhp();
            user.setBalance(currentBalance + refundAmount);
            userRepository.save(user);
        });

        expenseRepository.delete(expense);
        return ResponseEntity.ok(Map.of("message", "Expense deleted successfully."));
    }
}
