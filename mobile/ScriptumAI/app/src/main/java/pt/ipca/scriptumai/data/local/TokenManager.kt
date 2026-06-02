package pt.ipca.scriptumai.data.local

import android.content.Context
import android.content.SharedPreferences

/**
 * Persistent token store backed by SharedPreferences.
 * Call [init] once (e.g. in MainActivity.onCreate) before using any other method.
 */
object TokenManager {

    private const val PREFS_NAME = "scriptumai_auth"
    private const val KEY_ACCESS    = "access_token"
    private const val KEY_REFRESH   = "refresh_token"
    private const val KEY_ORG_ID    = "organization_id"
    private const val KEY_USER_ID   = "user_id"
    private const val KEY_USER_NAME = "user_name"

    private lateinit var prefs: SharedPreferences
    private lateinit var appContext: Context

    fun init(context: Context) {
        if (!::prefs.isInitialized) {
            appContext = context.applicationContext
            prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    fun getAppContext(): Context = appContext

    fun saveTokens(access: String, refresh: String) {
        prefs.edit()
            .putString(KEY_ACCESS, access)
            .putString(KEY_REFRESH, refresh)
            .apply()
    }

    fun saveOrgId(orgId: String) {
        prefs.edit().putString(KEY_ORG_ID, orgId).apply()
    }

    fun saveUserInfo(userId: String, name: String) {
        prefs.edit()
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USER_NAME, name)
            .apply()
    }

    fun getAccessToken(): String?  = prefs.getString(KEY_ACCESS, null)
    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH, null)
    fun getOrgId(): String?        = prefs.getString(KEY_ORG_ID, null)
    fun getUserId(): String?       = prefs.getString(KEY_USER_ID, null)
    fun getUserName(): String?     = prefs.getString(KEY_USER_NAME, null)

    fun bearerHeader(): String = "Bearer ${getAccessToken().orEmpty()}"

    fun clear() {
        prefs.edit()
            .remove(KEY_ACCESS)
            .remove(KEY_REFRESH)
            .remove(KEY_ORG_ID)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_NAME)
            .apply()
    }

    fun isLoggedIn(): Boolean = getAccessToken() != null
}
