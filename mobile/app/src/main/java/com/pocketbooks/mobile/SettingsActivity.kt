package com.pocketbooks.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.pocketbooks.mobile.databinding.ActivitySettingsBinding
import com.pocketbooks.mobile.model.ApiUser

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private val prefsName = "pocketbooks_mobile_settings"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (!SessionManager.isLoggedIn(this)) {
            finish()
            return
        }

        binding.btnBack.setOnClickListener { finish() }
        binding.btnSaveProfile.setOnClickListener { saveProfile() }
        binding.btnLogout.setOnClickListener { logout() }
        binding.btnDeleteAccount.setOnClickListener { deleteAccount() }

        setupCurrencySpinner()
        loadSettings()
    }

    private fun setupCurrencySpinner() {
        val currencies = listOf("PHP", "USD", "EUR", "JPY", "GBP")
        binding.spCurrency.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, currencies)
    }

    private fun loadSettings() {
        val user = SessionManager.getUser(this)
        val prefs = getSharedPreferences(prefsName, MODE_PRIVATE)

        binding.etName.setText(user?.name.orEmpty())
        binding.etEmail.setText(user?.email.orEmpty())
        binding.etBudget.setText(prefs.getString("budget", ""))
        binding.etInstitution.setText(prefs.getString("institution", ""))
        binding.swEmailReceipts.isChecked = prefs.getBoolean("emailReceipts", true)
        binding.swExpenseAlerts.isChecked = prefs.getBoolean("expenseAlerts", true)
        binding.swWeeklySummary.isChecked = prefs.getBoolean("weeklySummary", false)
        binding.swLoginAlerts.isChecked = prefs.getBoolean("loginAlerts", true)

        val currency = prefs.getString("displayCurrency", "PHP") ?: "PHP"
        val adapter = binding.spCurrency.adapter as ArrayAdapter<String>
        val index = (0 until adapter.count).firstOrNull { adapter.getItem(it) == currency } ?: 0
        binding.spCurrency.setSelection(index)
    }

    private fun saveProfile() {
        val name = binding.etName.text?.toString()?.trim().orEmpty()
        val email = binding.etEmail.text?.toString()?.trim().orEmpty()
        val budget = binding.etBudget.text?.toString()?.trim().orEmpty()
        val institution = binding.etInstitution.text?.toString()?.trim().orEmpty()
        val currency = binding.spCurrency.selectedItem?.toString() ?: "PHP"

        if (name.isBlank()) {
            binding.etName.error = "Name is required."
            return
        }

        if (email.isBlank()) {
            binding.etEmail.error = "Email is required."
            return
        }

        val prefs = getSharedPreferences(prefsName, MODE_PRIVATE)
        prefs.edit()
            .putString("budget", budget)
            .putString("institution", institution)
            .putString("displayCurrency", currency)
            .putBoolean("emailReceipts", binding.swEmailReceipts.isChecked)
            .putBoolean("expenseAlerts", binding.swExpenseAlerts.isChecked)
            .putBoolean("weeklySummary", binding.swWeeklySummary.isChecked)
            .putBoolean("loginAlerts", binding.swLoginAlerts.isChecked)
            .apply()

        val currentUser = SessionManager.getUser(this)
        SessionManager.saveSession(
            this,
            ApiUser(
                id = currentUser?.id.orEmpty(),
                name = name,
                email = email,
                createdAt = currentUser?.createdAt,
            ),
            SessionManager.getToken(this),
        )

        Toast.makeText(this, "Settings saved.", Toast.LENGTH_SHORT).show()
    }

    private fun logout() {
        SessionManager.clear(this)
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }

    private fun deleteAccount() {
        AlertDialog.Builder(this)
            .setTitle("Delete Account")
            .setMessage("This will clear the local account session on this device.")
            .setPositiveButton("Delete") { _, _ ->
                SessionManager.clear(this)
                getSharedPreferences(prefsName, MODE_PRIVATE).edit().clear().apply()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}