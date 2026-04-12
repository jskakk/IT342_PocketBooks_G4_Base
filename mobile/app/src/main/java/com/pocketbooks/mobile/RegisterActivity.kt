package com.pocketbooks.mobile

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.pocketbooks.mobile.databinding.ActivityRegisterBinding
import com.pocketbooks.mobile.model.ErrorResponse
import com.pocketbooks.mobile.model.RegisterRequest
import com.pocketbooks.mobile.network.ApiClient
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnRegister.setOnClickListener {
            handleRegister()
        }

        binding.tvGoToLogin.setOnClickListener {
            finish()
        }
    }

    private fun handleRegister() {
        val name = binding.etName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (name.isBlank()) {
            binding.etName.error = getString(R.string.name_required)
            return
        }

        if (!isValidEmail(email)) {
            binding.etEmail.error = getString(R.string.invalid_email)
            return
        }

        if (password.length < 8) {
            binding.etPassword.error = getString(R.string.password_min)
            return
        }

        binding.btnRegister.isEnabled = false

        lifecycleScope.launch {
            try {
                val request = RegisterRequest(fullName = name, email = email, password = password)
                val response = ApiClient.apiService.register(request)

                if (response.isSuccessful) {
                    Toast.makeText(
                        this@RegisterActivity,
                        getString(R.string.register_success),
                        Toast.LENGTH_SHORT
                    ).show()

                    startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                    finish()
                } else {
                    val errorMessage = parseError(response.errorBody()?.string())
                    Toast.makeText(this@RegisterActivity, errorMessage, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@RegisterActivity,
                    getString(R.string.network_error, e.localizedMessage ?: "Unknown"),
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.btnRegister.isEnabled = true
            }
        }
    }

    private fun parseError(raw: String?): String {
        return try {
            val parsed = Gson().fromJson(raw, ErrorResponse::class.java)
            parsed.error ?: parsed.message ?: getString(R.string.register_failed)
        } catch (_: Exception) {
            getString(R.string.register_failed)
        }
    }

    private fun isValidEmail(email: String): Boolean {
        return email.isNotBlank() && Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
}
