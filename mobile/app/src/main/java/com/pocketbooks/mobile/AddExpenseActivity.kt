package com.pocketbooks.mobile

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.pocketbooks.mobile.databinding.ActivityAddExpenseBinding
import com.pocketbooks.mobile.model.CreateExpenseRequest
import com.pocketbooks.mobile.network.ApiClient
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import android.app.DatePickerDialog

class AddExpenseActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAddExpenseBinding
    private var categories = listOf("Food", "Transportation", "School", "Bills", "Shopping", "Health", "Entertainment", "Other")
    private var currencies = listOf("PHP", "USD", "EUR", "JPY", "GBP")
    private var selectedCategory = categories.first()
    private var selectedCurrency = currencies.first()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddExpenseBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (!SessionManager.isLoggedIn(this)) {
            finish()
            return
        }

        binding.etDate.setText(SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()))
        // prevent keyboard and open date picker on click
        binding.etDate.isFocusable = false
        binding.etDate.setOnClickListener { openDatePicker() }
        binding.btnBack.setOnClickListener { finish() }
        binding.btnSaveExpense.setOnClickListener { submitExpense() }

        setupSpinners()
        loadMeta()
    }

    private fun openDatePicker() {
        val calendar = Calendar.getInstance()
        // parse current value if present
        try {
            val current = binding.etDate.text.toString()
            if (current.isNotBlank()) {
                val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val d = sdf.parse(current)
                if (d != null) calendar.time = d
            }
        } catch (_: Exception) { }

        val year = calendar.get(Calendar.YEAR)
        val month = calendar.get(Calendar.MONTH)
        val day = calendar.get(Calendar.DAY_OF_MONTH)

        val dpd = DatePickerDialog(this, { _, y, m, d ->
            val selectedCal = Calendar.getInstance()
            selectedCal.set(y, m, d)
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            binding.etDate.setText(sdf.format(selectedCal.time))
        }, year, month, day)

        dpd.show()
    }

    private fun setupSpinners() {
        binding.spCategory.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, categories)
        binding.spCurrency.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, currencies)

        binding.spCategory.setOnItemSelectedListener(object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: android.widget.AdapterView<*>,
                view: android.view.View?,
                position: Int,
                id: Long,
            ) {
                selectedCategory = categories[position]
            }

            override fun onNothingSelected(parent: android.widget.AdapterView<*>) = Unit
        })

        binding.spCurrency.setOnItemSelectedListener(object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: android.widget.AdapterView<*>,
                view: android.view.View?,
                position: Int,
                id: Long,
            ) {
                selectedCurrency = currencies[position]
            }

            override fun onNothingSelected(parent: android.widget.AdapterView<*>) = Unit
        })
    }

    private fun loadMeta() {
        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getMeta()
                if (response.isSuccessful) {
                    val meta = response.body()
                    val loadedCategories = meta?.categories?.takeIf { it.isNotEmpty() } ?: categories
                    val loadedCurrencies = meta?.currencies?.keys?.toList()?.takeIf { it.isNotEmpty() } ?: currencies

                    categories = loadedCategories
                    currencies = loadedCurrencies
                    setupSpinners()
                }
            } catch (_: Exception) {
                // Fall back to local defaults when the meta endpoint is unavailable.
            }
        }
    }

    private fun submitExpense() {
        val title = binding.etTitle.text.toString().trim()
        val amount = binding.etAmount.text.toString().trim().toDoubleOrNull()
        val expenseDate = binding.etDate.text.toString().trim()
        val notes = binding.etNotes.text.toString().trim()
        val receiptName = binding.etReceiptName.text.toString().trim()

        if (title.isBlank()) {
            binding.etTitle.error = "Expense title is required."
            return
        }

        if (amount == null || amount <= 0) {
            binding.etAmount.error = "Amount must be greater than zero."
            return
        }

        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.createExpense(
                    CreateExpenseRequest(
                        title = title,
                        category = selectedCategory,
                        amount = amount,
                        currency = selectedCurrency,
                        expenseDate = expenseDate,
                        notes = notes,
                        receiptName = receiptName,
                        receiptSize = if (receiptName.isBlank()) 0 else receiptName.length.toLong(),
                    )
                )

                if (response.isSuccessful) {
                    Toast.makeText(this@AddExpenseActivity, "Expense saved successfully.", Toast.LENGTH_SHORT).show()
                    setResult(RESULT_OK)
                    finish()
                } else {
                    Toast.makeText(this@AddExpenseActivity, "Could not save expense.", Toast.LENGTH_LONG).show()
                }
            } catch (error: Exception) {
                Toast.makeText(this@AddExpenseActivity, error.localizedMessage ?: "Could not save expense.", Toast.LENGTH_LONG).show()
            }
        }
    }
}