package com.pocketbooks.backend.service;

/**
 * Expense Factory Pattern
 * Encapsulates expense creation logic from multiple sources.
 * Ensures consistent normalization and validation.
 */
public class ExpenseFactory {

    private static final String DEFAULT_CURRENCY = "PHP";
    private static final String DEFAULT_CATEGORY = "Other";

    public static class CreateExpenseRequest {
        private String title;
        private String description;
        private String category;
        private double amount;
        private String currency;
        private String expenseDate;
        private String receiptName;
        private String receiptUrl;

        public CreateExpenseRequest() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getExpenseDate() { return expenseDate; }
        public void setExpenseDate(String expenseDate) { this.expenseDate = expenseDate; }
        public String getReceiptName() { return receiptName; }
        public void setReceiptName(String receiptName) { this.receiptName = receiptName; }
        public String getReceiptUrl() { return receiptUrl; }
        public void setReceiptUrl(String receiptUrl) { this.receiptUrl = receiptUrl; }
    }

    public static class Expense {
        public String userId;
        public String title;
        public String description;
        public String category;
        public double amount;
        public String currency;
        public String expenseDate;
        public String receiptName;
        public String receiptUrl;
    }

    public static Expense createFromRequest(CreateExpenseRequest request, String userId) {
        validateRequest(request);

        Expense expense = new Expense();
        expense.userId = userId;
        expense.title = request.getTitle().trim();
        expense.description = request.getDescription() != null ? request.getDescription().trim() : "";
        expense.category = normalizeCategory(request.getCategory());
        expense.amount = normalizeAmount(request.getAmount());
        expense.currency = normalizeCurrency(request.getCurrency());
        expense.expenseDate = request.getExpenseDate();
        expense.receiptName = request.getReceiptName() != null ? request.getReceiptName().trim() : "";
        expense.receiptUrl = request.getReceiptUrl();

        return expense;
    }

    public static Expense createFromReceipt(String userId, String receiptUrl, String title, double amount) {
        Expense expense = new Expense();
        expense.userId = userId;
        expense.title = title != null ? title.trim() : "Receipt";
        expense.description = "Receipt-based expense";
        expense.category = DEFAULT_CATEGORY;
        expense.amount = normalizeAmount(amount);
        expense.currency = DEFAULT_CURRENCY;
        expense.receiptUrl = receiptUrl;
        expense.receiptName = extractFileName(receiptUrl);
        expense.expenseDate = java.time.LocalDate.now().toString();

        return expense;
    }

    public static Expense createFromImport(String userId, String csvLine) {
        String[] parts = csvLine.split(",");
        if (parts.length < 3) {
            throw new IllegalArgumentException("CSV line must have at least: title,category,amount");
        }

        Expense expense = new Expense();
        expense.userId = userId;
        expense.title = parts[0].trim();
        expense.category = normalizeCategory(parts[1].trim());
        expense.amount = normalizeAmount(Double.parseDouble(parts[2].trim()));
        expense.currency = parts.length > 3 ? normalizeCurrency(parts[3].trim()) : DEFAULT_CURRENCY;
        expense.expenseDate = parts.length > 4 ? parts[4].trim() : java.time.LocalDate.now().toString();
        expense.description = parts.length > 5 ? parts[5].trim() : "";

        return expense;
    }

    private static void validateRequest(CreateExpenseRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Expense title is required");
        }
        if (request.getAmount() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
    }

    private static String normalizeCategory(String category) {
        String[] validCategories = {
                "Food", "Transportation", "School", "Bills",
                "Shopping", "Health", "Entertainment", "Other"
        };

        if (category == null) return DEFAULT_CATEGORY;

        for (String valid : validCategories) {
            if (valid.equalsIgnoreCase(category.trim())) {
                return valid;
            }
        }

        return DEFAULT_CATEGORY;
    }

    private static String normalizeCurrency(String currency) {
        String[] validCurrencies = {"PHP", "USD", "EUR", "JPY", "GBP"};

        if (currency == null) return DEFAULT_CURRENCY;

        String normalized = currency.trim().toUpperCase();
        for (String valid : validCurrencies) {
            if (valid.equals(normalized)) {
                return valid;
            }
        }

        return DEFAULT_CURRENCY;
    }

    private static double normalizeAmount(double amount) {
        return Math.round(amount * 100.0) / 100.0;
    }

    private static String extractFileName(String url) {
        if (url == null || url.isEmpty()) return "";
        return url.substring(url.lastIndexOf('/') + 1);
    }
}
