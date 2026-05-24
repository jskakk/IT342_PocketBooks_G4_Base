package com.pocketbooks.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.setPadding
import androidx.lifecycle.lifecycleScope
import com.google.android.material.card.MaterialCardView
import com.pocketbooks.mobile.databinding.ActivityAnalyticsBinding
import com.pocketbooks.mobile.model.ExpenseItem
import com.pocketbooks.mobile.network.ApiClient
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Calendar
import java.util.Locale

class AnalyticsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAnalyticsBinding
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    private var allExpenses: List<ExpenseItem> = emptyList()
    private var activeRange = SpendingRange.MONTH

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAnalyticsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (!SessionManager.isLoggedIn(this)) {
            finish()
            return
        }

        binding.btnBack.setOnClickListener { finish() }
        binding.btnWeek.setOnClickListener { setRange(SpendingRange.WEEK) }
        binding.btnMonth.setOnClickListener { setRange(SpendingRange.MONTH) }
        binding.btnAll.setOnClickListener { setRange(SpendingRange.ALL) }

        loadAnalytics()
    }

    override fun onResume() {
        super.onResume()
        if (SessionManager.isLoggedIn(this)) {
            renderAnalytics()
        }
    }

    private fun loadAnalytics() {
        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getExpenses()
                if (response.isSuccessful) {
                    allExpenses = response.body()?.expenses.orEmpty()
                    renderAnalytics()
                } else {
                    binding.tvStatus.text = "Unable to load analytics."
                }
            } catch (error: Exception) {
                Toast.makeText(this@AnalyticsActivity, error.localizedMessage ?: "Could not load analytics.", Toast.LENGTH_LONG).show()
                binding.tvStatus.text = "Unable to load analytics."
            }
        }
    }

    private fun setRange(range: SpendingRange) {
        activeRange = range
        renderAnalytics()
    }

    private fun renderAnalytics() {
        val filtered = when (activeRange) {
            SpendingRange.WEEK -> filterLastDays(7)
            SpendingRange.MONTH -> filterCurrentMonth()
            SpendingRange.ALL -> allExpenses
        }

        val total = filtered.sumOf { it.amountPhp }
        val previousMonth = getPreviousMonthTotal()
        val change = if (previousMonth > 0) ((total - previousMonth) / previousMonth) * 100 else 0.0
        val average = if (filtered.isNotEmpty()) total / filtered.size else 0.0

        binding.tvTotal.text = currencyFormat.format(total)
        binding.tvAverage.text = currencyFormat.format(average)
        binding.tvTransactions.text = "${filtered.size} transactions"
        binding.tvTrend.text = if (change >= 0) {
            "↑ ${String.format(Locale.US, "%.1f", change)}% vs previous month"
        } else {
            "↓ ${String.format(Locale.US, "%.1f", kotlin.math.abs(change))}% vs previous month"
        }

        renderCategoryBreakdown(filtered)
        renderDailyTrend(filtered)
    }

    private fun filterCurrentMonth(): List<ExpenseItem> {
        val prefix = java.time.LocalDate.now().toString().take(7)
        return allExpenses.filter { it.expenseDate.startsWith(prefix) }
    }

    private fun filterLastDays(days: Int): List<ExpenseItem> {
        val calendar = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -days + 1) }
        val cutoff = calendar.time
        return allExpenses.filter { expense ->
            runCatching {
                val date = java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(expense.expenseDate)
                date != null && !date.before(cutoff)
            }.getOrDefault(false)
        }
    }

    private fun getPreviousMonthTotal(): Double {
        val calendar = Calendar.getInstance().apply { add(Calendar.MONTH, -1) }
        val prefix = String.format(Locale.US, "%04d-%02d", calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH) + 1)
        return allExpenses.filter { it.expenseDate.startsWith(prefix) }.sumOf { it.amountPhp }
    }

    private fun renderCategoryBreakdown(expenses: List<ExpenseItem>) {
        binding.categoryContainer.removeAllViews()
        val categories = expenses.groupBy { it.category }
            .map { (category, items) -> category to items.sumOf { it.amountPhp } }
            .sortedByDescending { it.second }

        if (categories.isEmpty()) {
            addEmptyState(binding.categoryContainer, "No spending data yet. Add expenses to see analytics.")
            return
        }

        val max = categories.maxOf { it.second }
        categories.forEach { (category, value) ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(0)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).apply { bottomMargin = 20 }
            }

            row.addView(android.widget.TextView(this).apply {
                text = category
                textSize = 16f
            })
            row.addView(android.widget.TextView(this).apply {
                text = currencyFormat.format(value)
            })

            val barContainer = android.widget.LinearLayout(this).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    18,
                ).apply { topMargin = 10 }
                setBackgroundColor(0xFFE8E8E8.toInt())
            }

            val bar = android.view.View(this).apply {
                setBackgroundColor(0xFF0F766E.toInt())
                layoutParams = LinearLayout.LayoutParams(
                    if (max == 0.0) 0 else ((value / max) * 1000).toInt(),
                    LinearLayout.LayoutParams.MATCH_PARENT,
                )
            }

            barContainer.addView(bar)
            row.addView(barContainer)
            binding.categoryContainer.addView(row)
        }
    }

    private fun renderDailyTrend(expenses: List<ExpenseItem>) {
        binding.trendContainer.removeAllViews()
        val grouped = expenses.groupBy { it.expenseDate }
            .map { (date, items) -> date to items.sumOf { it.amountPhp } }
            .sortedBy { it.first }

        if (grouped.isEmpty()) {
            addEmptyState(binding.trendContainer, "No daily trend yet.")
            return
        }

        val max = grouped.maxOf { it.second }
        grouped.forEach { (date, value) ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).apply { bottomMargin = 16 }
            }

            row.addView(android.widget.TextView(this).apply {
                text = date.takeLast(5)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            })

            val barWrapper = MaterialCardView(this).apply {
                radius = 18f
                layoutParams = LinearLayout.LayoutParams(0, 18, 2f)
                setCardBackgroundColor(0xFFE8E8E8.toInt())
                setContentPadding(0, 0, 0, 0)
            }

            val bar = android.view.View(this).apply {
                setBackgroundColor(0xFF0F766E.toInt())
                layoutParams = LinearLayout.LayoutParams(
                    if (max == 0.0) 0 else ((value / max) * 1000).toInt(),
                    LinearLayout.LayoutParams.MATCH_PARENT,
                )
            }

            barWrapper.addView(bar)
            row.addView(barWrapper)

            row.addView(android.widget.TextView(this).apply {
                text = currencyFormat.format(value)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            })

            binding.trendContainer.addView(row)
        }
    }

    private fun addEmptyState(container: LinearLayout, message: String) {
        container.addView(android.widget.TextView(this).apply {
            text = message
            setPadding(8)
        })
    }

    private enum class SpendingRange { WEEK, MONTH, ALL }
}