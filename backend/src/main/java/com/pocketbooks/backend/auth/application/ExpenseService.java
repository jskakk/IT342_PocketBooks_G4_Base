package com.pocketbooks.backend.auth.application;

import com.pocketbooks.backend.auth.domain.Expense;
import com.pocketbooks.backend.auth.domain.ExpenseRepository;
import com.pocketbooks.backend.auth.domain.User;
import com.pocketbooks.backend.auth.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @Autowired
    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    public List<Expense> getExpensesForUserIdentifier(String userIdentifier) {
        // userIdentifier may be email or numeric id
        Optional<User> optUser = findUserByIdentifier(userIdentifier);
        if (optUser.isEmpty()) {
            return List.of();
        }

        String userEmail = optUser.get().getEmail();
        return expenseRepository.findByUserId(userEmail);
    }

    @Transactional
    public Expense createExpenseForUser(String userIdentifier, Expense expense) {
        User user = findUserByIdentifier(userIdentifier)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // assign id and user, adjust balance
        expense.setId(UUID.randomUUID().toString());
        expense.setUserId(user.getEmail());

        // ensure amountPhp is set — assume frontend provides amountPhp or calculate simple pass-through
        if (expense.getAmountPhp() == null) {
            expense.setAmountPhp(expense.getAmount());
        }

        // deduct balance
        if (user.getBalance() == null) user.setBalance(0.0);
        user.setBalance(user.getBalance() - expense.getAmountPhp());
        userRepository.save(user);

        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpenseForUser(String userIdentifier, String expenseId) {
        Optional<User> optUser = findUserByIdentifier(userIdentifier);
        if (optUser.isEmpty()) throw new RuntimeException("User not found");
        User user = optUser.get();

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (expense.getUserId() == null || !expense.getUserId().equalsIgnoreCase(user.getEmail())) {
            throw new RuntimeException("Not allowed");
        }

        // adjust balance
        if (user.getBalance() == null) user.setBalance(0.0);
        user.setBalance(user.getBalance() + expense.getAmountPhp());
        userRepository.save(user);

        expenseRepository.delete(expense);
    }

    private Optional<User> findUserByIdentifier(String ident) {
        if (ident == null) return Optional.empty();
        if (ident.contains("@")) {
            return userRepository.findByEmail(ident);
        }
        try {
            Long id = Long.parseLong(ident);
            return userRepository.findById(id);
        } catch (NumberFormatException e) {
            return userRepository.findByEmail(ident);
        }
    }
}
