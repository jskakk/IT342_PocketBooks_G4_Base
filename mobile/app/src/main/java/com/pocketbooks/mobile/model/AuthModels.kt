package com.pocketbooks.mobile.model

data class RegisterRequest(
    val fullName: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class ApiUser(
    val id: String,
    val name: String,
    val email: String,
    val createdAt: String? = null
)

data class AuthResponse(
    val token: String? = null,
    val email: String? = null,
    val fullName: String? = null,
    val role: String? = null,
    val message: String? = null
)

data class ErrorResponse(
    val error: String? = null,
    val message: String? = null
)
