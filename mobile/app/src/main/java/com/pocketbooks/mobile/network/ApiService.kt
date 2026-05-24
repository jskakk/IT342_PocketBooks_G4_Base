package com.pocketbooks.mobile.network

import com.pocketbooks.mobile.model.CreateExpenseRequest
import com.pocketbooks.mobile.model.CreateExpenseResponse
import com.pocketbooks.mobile.model.AuthResponse
import com.pocketbooks.mobile.model.ExpenseListResponse
import com.pocketbooks.mobile.model.LoginRequest
import com.pocketbooks.mobile.model.MetaResponse
import com.pocketbooks.mobile.model.RegisterRequest
import com.pocketbooks.mobile.model.TopUpRequest
import com.pocketbooks.mobile.model.WalletBalanceResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("api/wallet")
    suspend fun getWalletBalance(): Response<WalletBalanceResponse>

    @POST("api/wallet/topup")
    suspend fun topUpWallet(@Body request: TopUpRequest): Response<WalletBalanceResponse>

    @GET("api/expenses")
    suspend fun getExpenses(): Response<ExpenseListResponse>

    @POST("api/expenses")
    suspend fun createExpense(@Body request: CreateExpenseRequest): Response<CreateExpenseResponse>

    @DELETE("api/expenses/{expenseId}")
    suspend fun deleteExpense(@Path("expenseId") expenseId: String): Response<Unit>

    @GET("api/meta")
    suspend fun getMeta(): Response<MetaResponse>
}
