package com.pocketbooks.mobile

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.pocketbooks.mobile.databinding.ActivityHomeBinding

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val userName = intent.getStringExtra("user_name") ?: "User"
        val userEmail = intent.getStringExtra("user_email") ?: "No email"

        binding.tvWelcome.text = getString(R.string.welcome_user, userName)
        binding.tvEmail.text = userEmail
    }
}
