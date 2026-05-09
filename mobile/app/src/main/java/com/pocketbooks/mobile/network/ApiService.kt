package com.pocketbooks.mobile.network

import com.pocketbooks.mobile.model.AuthResponse
import com.pocketbooks.mobile.model.LoginRequest
import com.pocketbooks.mobile.model.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
}
