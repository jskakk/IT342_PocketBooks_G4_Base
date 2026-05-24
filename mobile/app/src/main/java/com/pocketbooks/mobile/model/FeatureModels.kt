package com.pocketbooks.mobile.model

data class WalletBalanceResponse(
    val balance: Double? = null
)

data class TopUpRequest(
    val amount: Double
)

data class WalletTopUpEntry(
    val amount: Double,
    val timestamp: String,
    val balanceAfter: Double,
    val currency: String = "PHP"
)

data class ExpenseItem(
    val id: String,
    val userId: String,
    val title: String,
    val category: String,
    val amount: Double,
    val currency: String,
    val amountPhp: Double,
    val expenseDate: String,
    val notes: String,
    val receiptName: String,
    val receiptSize: Long,
    val createdAt: String
)

data class ExpenseListResponse(
    val expenses: List<ExpenseItem> = emptyList()
)

data class CreateExpenseRequest(
    val title: String,
    val category: String,
    val amount: Double,
    val currency: String,
    val expenseDate: String,
    val notes: String,
    val receiptName: String,
    val receiptSize: Long
)

data class CreateExpenseResponse(
    val message: String? = null,
    val expense: ExpenseItem? = null,
    val balance: Double? = null
)

data class MetaResponse(
    val currencies: Map<String, Double> = emptyMap(),
    val categories: List<String> = emptyList(),
    val defaultCurrency: String? = null
)