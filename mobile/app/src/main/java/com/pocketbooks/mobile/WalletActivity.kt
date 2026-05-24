package com.pocketbooks.mobile

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.setPadding
import androidx.lifecycle.lifecycleScope
import com.google.android.material.card.MaterialCardView
import com.pocketbooks.mobile.databinding.ActivityWalletBinding
import com.pocketbooks.mobile.model.WalletTopUpEntry
import com.pocketbooks.mobile.network.ApiClient
import com.pocketbooks.mobile.model.TopUpRequest
import com.pocketbooks.mobile.model.MetaResponse
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WalletActivity : AppCompatActivity() {

    private lateinit var binding: ActivityWalletBinding
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    private val gson = Gson()
    private val historyKey = "wallet_topup_history"
    private var balance = 0.0
    private var selectedCurrency = "PHP"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityWalletBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (!SessionManager.isLoggedIn(this)) {
            finish()
            return
        }

        binding.btnBack.setOnClickListener { finish() }
        binding.btnTopUp100.setOnClickListener { binding.etAmount.setText("100") }
        binding.btnTopUp250.setOnClickListener { binding.etAmount.setText("250") }
        binding.btnTopUp500.setOnClickListener { binding.etAmount.setText("500") }
        binding.btnTopUp1000.setOnClickListener { binding.etAmount.setText("1000") }
        binding.btnTopUp.setOnClickListener { submitTopUp() }

        setupCurrencySpinner()
        loadWallet()
        renderHistory(loadHistory())
    }

    private fun setupCurrencySpinner() {
        val currencies = listOf("PHP", "USD", "EUR", "JPY", "GBP")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, currencies)
        binding.spCurrency.adapter = adapter
        binding.spCurrency.setSelection(0)
        binding.spCurrency.setOnItemSelectedListener(object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: android.widget.AdapterView<*>,
                view: android.view.View?,
                position: Int,
                id: Long,
            ) {
                selectedCurrency = currencies[position]
                updateDisplayedBalance()
            }

            override fun onNothingSelected(parent: android.widget.AdapterView<*>) = Unit
        })
    }

    private fun loadWallet() {
        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getWalletBalance()
                if (response.isSuccessful) {
                    balance = response.body()?.balance ?: 0.0
                    updateDisplayedBalance()
                }
            } catch (error: Exception) {
                Toast.makeText(this@WalletActivity, error.localizedMessage ?: "Unable to load balance.", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun updateDisplayedBalance() {
        binding.tvBalance.text = currencyFormat.format(convertFromPhp(balance, selectedCurrency))
    }

    private fun submitTopUp() {
        val amount = binding.etAmount.text.toString().trim().toDoubleOrNull()
        if (amount == null || amount <= 0) {
            binding.etAmount.error = "Enter a valid amount."
            return
        }

        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.topUpWallet(TopUpRequest(amount))
                if (response.isSuccessful) {
                    balance = response.body()?.balance ?: balance
                    updateDisplayedBalance()
                    saveHistory(amount)
                    renderHistory(loadHistory())
                    binding.etAmount.text?.clear()
                    Toast.makeText(this@WalletActivity, "Wallet topped up successfully.", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@WalletActivity, "Top-up failed.", Toast.LENGTH_LONG).show()
                }
            } catch (error: Exception) {
                Toast.makeText(this@WalletActivity, error.localizedMessage ?: "Top-up failed.", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun saveHistory(amount: Double) {
        val entry = WalletTopUpEntry(
            amount = amount,
            timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date()),
            balanceAfter = balance,
            currency = selectedCurrency,
        )

        val currentHistory = loadHistory().toMutableList()
        currentHistory.add(0, entry)
        val raw = gson.toJson(currentHistory.take(5))
        getSharedPreferences(historyKey, MODE_PRIVATE).edit().putString("entries", raw).apply()
    }

    private fun loadHistory(): List<WalletTopUpEntry> {
        val raw = getSharedPreferences(historyKey, MODE_PRIVATE).getString("entries", null)
            ?: return emptyList()
        val type = object : TypeToken<List<WalletTopUpEntry>>() {}.type
        return runCatching { gson.fromJson<List<WalletTopUpEntry>>(raw, type) }.getOrDefault(emptyList())
    }

    private fun renderHistory(history: List<WalletTopUpEntry>) {
        binding.historyContainer.removeAllViews()

        if (history.isEmpty()) {
            val emptyView = android.widget.TextView(this).apply {
                text = "No top-up history yet."
                setPadding(8)
            }
            binding.historyContainer.addView(emptyView)
            return
        }

        history.forEach { entry ->
            val card = MaterialCardView(this).apply {
                radius = 24f
                cardElevation = 3f
                setContentPadding(28, 28, 28, 28)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).apply { bottomMargin = 20 }
            }

            val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
            content.addView(android.widget.TextView(this).apply { text = "Top-up ${currencyFormat.format(entry.amount)}" })
            content.addView(android.widget.TextView(this).apply { text = entry.timestamp })
            content.addView(android.widget.TextView(this).apply { text = "Balance after: ${currencyFormat.format(entry.balanceAfter)}" })

            card.addView(content)
            binding.historyContainer.addView(card)
        }
    }

    private fun convertFromPhp(amountPhp: Double, currency: String): Double {
        val rates = mapOf("PHP" to 1.0, "USD" to 56.12, "EUR" to 61.08, "JPY" to 0.38, "GBP" to 71.52)
        val rate = rates[currency] ?: 1.0
        return if (currency == "PHP") amountPhp else amountPhp / rate
    }
}