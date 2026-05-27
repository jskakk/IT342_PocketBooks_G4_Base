package com.pocketbooks.backend.category.application;

import com.pocketbooks.backend.auth.domain.Expense;
import com.pocketbooks.backend.auth.domain.ExpenseRepository;
import com.pocketbooks.backend.category.domain.Category;
import com.pocketbooks.backend.category.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository, ExpenseRepository expenseRepository) {
        this.categoryRepository = categoryRepository;
        this.expenseRepository = expenseRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<Map<String, Object>> getAllCategoriesWithUsage() {
        Map<String, List<Expense>> expensesByCategory = expenseRepository.findAll().stream()
            .filter(expense -> expense.getCategory() != null && !expense.getCategory().trim().isEmpty())
            .collect(Collectors.groupingBy(expense -> normalize(expense.getCategory())));

        return expensesByCategory.entrySet().stream()
            .map(entry -> {
                List<Expense> expenses = entry.getValue();
                String displayName = expenses.stream()
                    .map(Expense::getCategory)
                    .filter(value -> value != null && !value.trim().isEmpty())
                    .findFirst()
                    .orElse(entry.getKey());

                Map<String, Object> row = new HashMap<>();
                row.put("id", entry.getKey());
                row.put("name", displayName);
                row.put("icon", iconForCategory(displayName));
                row.put("createdAt", expenses.stream()
                    .map(Expense::getCreatedAt)
                    .filter(Objects::nonNull)
                    .min(LocalDateTime::compareTo)
                    .map(LocalDateTime::toString)
                    .orElse(""));
                row.put("usedInExpenses", (long) expenses.size());
                row.put("totalSpent", expenses.stream().mapToDouble(this::getExpenseValue).sum());
                return row;
            })
            .sorted((left, right) -> {
                long leftCount = ((Number) left.getOrDefault("usedInExpenses", 0L)).longValue();
                long rightCount = ((Number) right.getOrDefault("usedInExpenses", 0L)).longValue();
                if (leftCount != rightCount) {
                return Long.compare(rightCount, leftCount);
                }
                String leftName = String.valueOf(left.getOrDefault("name", ""));
                String rightName = String.valueOf(right.getOrDefault("name", ""));
                return leftName.compareToIgnoreCase(rightName);
            })
                .collect(Collectors.toList());
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));
    }

    public Category createCategory(String name, String icon) {
        if (categoryRepository.existsByName(name)) {
            throw new RuntimeException("Category with name '" + name + "' already exists");
        }
        Category category = new Category(name, icon);
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, String name, String icon) {
        Category category = getCategoryById(id);

        if (!category.getName().equals(name) && categoryRepository.existsByName(name)) {
            throw new RuntimeException("Category with name '" + name + "' already exists");
        }

        category.setName(name);
        category.setIcon(icon);
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found with ID: " + id);
        }
        categoryRepository.deleteById(id);
    }

    public boolean categoryExists(String name) {
        return categoryRepository.existsByName(name);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private double getExpenseValue(Expense expense) {
        if (expense.getAmountPhp() != null) {
            return expense.getAmountPhp();
        }
        return expense.getAmount() == null ? 0.0 : expense.getAmount();
    }

    private String iconForCategory(String categoryName) {
        String normalized = normalize(categoryName);
        return switch (normalized) {
            case "food" -> "🍔";
            case "transportation" -> "🚌";
            case "school" -> "🎓";
            case "bills" -> "🧾";
            case "shopping" -> "🛍️";
            case "health" -> "🏥";
            case "entertainment" -> "🎬";
            default -> "📁";
        };
    }
}
