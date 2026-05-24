package com.pocketbooks.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.setPadding
import androidx.lifecycle.lifecycleScope
import com.google.android.material.card.MaterialCardView
import com.pocketbooks.mobile.databinding.ActivityHomeBinding
import com.pocketbooks.mobile.model.ExpenseItem
import com.pocketbooks.mobile.network.ApiClient
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    private var walletBalance = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (!SessionManager.isLoggedIn(this)) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        AuthTokenStore.token = SessionManager.getToken(this)

        binding.btnOpenWallet.setOnClickListener {
            startActivity(Intent(this, WalletActivity::class.java))
        }

        binding.btnOpenExpense.setOnClickListener {
            startActivity(Intent(this, AddExpenseActivity::class.java))
        }

        binding.btnOpenAnalytics.setOnClickListener {
            startActivity(Intent(this, AnalyticsActivity::class.java))
        }

        binding.btnOpenSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        binding.btnRefresh.setOnClickListener {
            loadDashboard()
        }

        binding.btnLogout.setOnClickListener {
            SessionManager.clear(this)
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }

        val user = SessionManager.getUser(this)
        binding.tvWelcome.text = getString(R.string.welcome_user, user?.name ?: "User")
        binding.tvEmail.text = user?.email ?: "No email"

        loadDashboard()
    }

    override fun onResume() {
        super.onResume()
        if (SessionManager.isLoggedIn(this)) {
            loadDashboard()
        }
    }

    private fun loadDashboard() {
        if (SessionManager.getToken(this).isBlank()) {
            return
        }

        lifecycleScope.launch {
            try {
                val walletResponse = ApiClient.apiService.getWalletBalance()
                if (walletResponse.isSuccessful) {
                    walletBalance = walletResponse.body()?.balance ?: 0.0
                    binding.tvWalletValue.text = currencyFormat.format(walletBalance)
                }

                val expensesResponse = ApiClient.apiService.getExpenses()
                if (expensesResponse.isSuccessful) {
                    renderExpenses(expensesResponse.body()?.expenses.orEmpty())
                } else {
                    binding.expenseContainer.removeAllViews()
                    addMessage("Unable to load expenses.")
                }
            } catch (error: Exception) {
                Toast.makeText(
                    this@HomeActivity,
                    error.localizedMessage ?: "Could not load dashboard.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun renderExpenses(expenses: List<ExpenseItem>) {
        binding.expenseContainer.removeAllViews()

        if (expenses.isEmpty()) {
            addMessage("No expenses yet. Add one to get started.")
            return
        }

        expenses.take(5).forEach { expense ->
            val card = MaterialCardView(this).apply {
                radius = 24f
                cardElevation = 4f
                setContentPadding(32, 32, 32, 32)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).apply {
                    bottomMargin = 24
                }
            }

            val content = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
            }

            val title = android.widget.TextView(this).apply {
                text = expense.title
                textSize = 18f
                setTypeface(typeface, android.graphics.Typeface.BOLD)
            }

            val details = android.widget.TextView(this).apply {
                text = "${expense.category} • ${expense.expenseDate}"
            }

            val amount = android.widget.TextView(this).apply {
                text = currencyFormat.format(expense.amountPhp)
            }

            val notes = android.widget.TextView(this).apply {
                text = if (expense.notes.isBlank()) "No notes provided." else expense.notes
            }

            val deleteButton = com.google.android.material.button.MaterialButton(this).apply {
                text = "Delete"
                setOnClickListener { deleteExpense(expense.id) }
            }

            content.addView(title)
            content.addView(details)
            content.addView(amount)
            content.addView(notes)
            content.addView(deleteButton)
            card.addView(content)
            binding.expenseContainer.addView(card)
        }
    }

    private fun addMessage(message: String) {
        val textView = android.widget.TextView(this).apply {
            text = message
            textSize = 16f
            setPadding(8)
        }
        binding.expenseContainer.addView(textView)
    }

    private fun deleteExpense(expenseId: String) {
        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.deleteExpense(expenseId)
                if (response.isSuccessful) {
                    loadDashboard()
                } else {
                    Toast.makeText(this@HomeActivity, "Failed to delete expense.", Toast.LENGTH_LONG).show()
                }
            } catch (error: Exception) {
                Toast.makeText(
                    this@HomeActivity,
                    error.localizedMessage ?: "Could not delete expense.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
}
