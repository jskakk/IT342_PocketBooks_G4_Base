package com.pocketbooks.mobile

import android.content.Context
import com.google.gson.Gson
import com.pocketbooks.mobile.model.ApiUser

object SessionManager {
    private const val PREFS_NAME = "pocketbooks_session"
    private const val KEY_USER = "auth_user"
    private const val KEY_TOKEN = "auth_token"

    private val gson = Gson()

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun saveSession(context: Context, user: ApiUser?, token: String?) {
        prefs(context).edit().apply {
            if (user != null) {
                putString(KEY_USER, gson.toJson(user))
            }
            if (!token.isNullOrBlank()) {
                putString(KEY_TOKEN, token)
            }
            apply()
        }

        AuthTokenStore.token = token.orEmpty()
    }

    fun getUser(context: Context): ApiUser? {
        val raw = prefs(context).getString(KEY_USER, null) ?: return null
        return runCatching { gson.fromJson(raw, ApiUser::class.java) }.getOrNull()
    }

    fun getToken(context: Context): String {
        return prefs(context).getString(KEY_TOKEN, "") ?: ""
    }

    fun isLoggedIn(context: Context): Boolean {
        return !getToken(context).isBlank() && getUser(context) != null
    }

    fun clear(context: Context) {
        prefs(context).edit().clear().apply()
        AuthTokenStore.token = ""
    }
}

object AuthTokenStore {
    @Volatile
    var token: String = ""
}