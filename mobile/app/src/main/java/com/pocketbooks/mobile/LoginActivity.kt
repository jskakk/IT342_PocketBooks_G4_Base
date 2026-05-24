package com.pocketbooks.mobile

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.pocketbooks.mobile.databinding.ActivityLoginBinding
import com.pocketbooks.mobile.model.ErrorResponse
import com.pocketbooks.mobile.model.LoginRequest
import com.pocketbooks.mobile.network.ApiClient
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (SessionManager.isLoggedIn(this)) {
            startActivity(Intent(this, HomeActivity::class.java))
            finish()
            return
        }

        binding.btnLogin.setOnClickListener {
            handleLogin()
        }

        binding.tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun handleLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (!isValidEmail(email)) {
            binding.etEmail.error = getString(R.string.invalid_email)
            return
        }

        if (password.isEmpty()) {
            binding.etPassword.error = getString(R.string.password_required)
            return
        }

        binding.btnLogin.isEnabled = false

        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.login(LoginRequest(email, password))

                if (response.isSuccessful && response.body() != null) {
                    val auth = response.body()!!
                    val sessionUser = com.pocketbooks.mobile.model.ApiUser(
                        id = auth.email ?: email,
                        name = auth.fullName ?: "User",
                        email = auth.email ?: email,
                    )
                    SessionManager.saveSession(this@LoginActivity, sessionUser, auth.token)
                    Toast.makeText(
                        this@LoginActivity,
                        auth.message ?: getString(R.string.login_success),
                        Toast.LENGTH_SHORT
                    ).show()

                    startActivity(Intent(this@LoginActivity, HomeActivity::class.java))
                    finish()
                } else {
                    val errorMessage = parseError(response.errorBody()?.string())
                    Toast.makeText(this@LoginActivity, errorMessage, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@LoginActivity,
                    getString(R.string.network_error, e.localizedMessage ?: "Unknown"),
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.btnLogin.isEnabled = true
            }
        }
    }

    private fun parseError(raw: String?): String {
        return try {
            val parsed = Gson().fromJson(raw, ErrorResponse::class.java)
            parsed.error ?: parsed.message ?: getString(R.string.login_failed)
        } catch (_: Exception) {
            getString(R.string.login_failed)
        }
    }

    private fun isValidEmail(email: String): Boolean {
        return email.isNotBlank() && Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
}
