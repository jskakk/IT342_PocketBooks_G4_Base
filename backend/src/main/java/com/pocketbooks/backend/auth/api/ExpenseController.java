package com.pocketbooks.backend.auth.api;

import com.pocketbooks.backend.auth.application.ExpenseService;
import com.pocketbooks.backend.auth.domain.Expense;
import com.pocketbooks.backend.auth.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserRepository userRepository;

    @Autowired
    public ExpenseController(ExpenseService expenseService, UserRepository userRepository) {
        this.expenseService = expenseService;
        this.userRepository = userRepository;
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equals(ga.getAuthority())) return true;
        }
        return false;
    }

    @GetMapping
    public ResponseEntity<?> listExpenses(@RequestParam(required = false) String userId, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error","Not authenticated"));
        }

        String authEmail = authentication.getName();
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error","userId is required"));
        }

        // allow if requesting own or admin
        boolean allowed = isAdmin(authentication) || authEmail.equals(userId) || authEmail.equalsIgnoreCase(userId);
        if (!allowed) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Expense> expenses = expenseService.getExpensesForUserIdentifier(userId);
        List<Map<String,Object>> list = expenses.stream().map(e -> {
            Map<String,Object> m = new HashMap<>();
            m.put("id", e.getId());
            m.put("userId", e.getUserId());
            m.put("title", e.getTitle());
            m.put("category", e.getCategory());
            m.put("amount", e.getAmount());
            m.put("currency", e.getCurrency());
            m.put("amountPhp", e.getAmountPhp());
            m.put("expenseDate", e.getExpenseDate());
            m.put("notes", e.getNotes());
            m.put("receiptName", e.getReceiptName());
            m.put("receiptSize", e.getReceiptSize());
            m.put("createdAt", e.getCreatedAt().toString());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("expenses", list));
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Map<String,Object> body, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error","Not authenticated"));
        }

        String authEmail = authentication.getName();
        String userId = (String) body.getOrDefault("userId", authEmail);

        boolean allowed = isAdmin(authentication) || authEmail.equals(userId) || authEmail.equalsIgnoreCase(userId);
        if (!allowed) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            Expense e = new Expense();
            e.setTitle((String) body.getOrDefault("title", ""));
            e.setCategory((String) body.getOrDefault("category", "Other"));
            e.setAmount(body.get("amount") instanceof Number ? ((Number) body.get("amount")).doubleValue() : 0.0);
            e.setCurrency((String) body.getOrDefault("currency", "PHP"));
            e.setAmountPhp(body.get("amountPhp") instanceof Number ? ((Number) body.get("amountPhp")).doubleValue() : e.getAmount());
            e.setExpenseDate((String) body.getOrDefault("expenseDate", java.time.LocalDate.now().toString()));
            e.setNotes((String) body.getOrDefault("notes", ""));
            e.setReceiptName((String) body.getOrDefault("receiptName", ""));
            e.setReceiptSize(body.get("receiptSize") instanceof Number ? ((Number) body.get("receiptSize")).intValue() : 0);

            Expense created = expenseService.createExpenseForUser(userId, e);

            Map<String,Object> resp = new HashMap<>();
            resp.put("message", "Expense created successfully.");
            Map<String,Object> exp = new HashMap<>();
            exp.put("id", created.getId());
            exp.put("userId", created.getUserId());
            exp.put("title", created.getTitle());
            exp.put("category", created.getCategory());
            exp.put("amount", created.getAmount());
            exp.put("currency", created.getCurrency());
            exp.put("amountPhp", created.getAmountPhp());
            exp.put("expenseDate", created.getExpenseDate());
            exp.put("notes", created.getNotes());
            exp.put("receiptName", created.getReceiptName());
            exp.put("receiptSize", created.getReceiptSize());
            exp.put("createdAt", created.getCreatedAt().toString());
            resp.put("expense", exp);

            // include balance
                resp.put("balance", userRepository.findByEmail(created.getUserId())
                    .map(user -> user.getBalance() == null ? 0.0 : user.getBalance())
                    .orElse(0.0));

            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable("id") String id, @RequestParam(required = false) String userId, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error","Not authenticated"));
        }

        String authEmail = authentication.getName();
        String uid = userId != null ? userId : authEmail;

        boolean allowed = isAdmin(authentication) || authEmail.equals(uid) || authEmail.equalsIgnoreCase(uid);
        if (!allowed) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            expenseService.deleteExpenseForUser(uid, id);
            return ResponseEntity.ok(Map.of("message","Expense deleted successfully."));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }
    }
}
