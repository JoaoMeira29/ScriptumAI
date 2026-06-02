package pt.ipca.scriptumai.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.MainActivity
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.data.local.TokenManager
import pt.ipca.scriptumai.data.network.NotificationApiService
import pt.ipca.scriptumai.data.network.RegisterDeviceRequest
import pt.ipca.scriptumai.data.network.RetrofitClient

class ScriptumFirebaseMessagingService : FirebaseMessagingService() {

    private val api: NotificationApiService by lazy {
        RetrofitClient.createService()
    }

    override fun onNewToken(token: String) {
        TokenManager.init(applicationContext)
        if (TokenManager.isLoggedIn()) {
            CoroutineScope(Dispatchers.IO).launch {
                runCatching {
                    api.registerDevice(
                        bearer = TokenManager.bearerHeader(),
                        body = RegisterDeviceRequest(fcmToken = token),
                    )
                }
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        TokenManager.init(applicationContext)
        val title = message.notification?.title ?: message.data["title"] ?: return
        val body = message.notification?.body ?: message.data["body"] ?: return
        showNotification(title, body)
    }

    private fun showNotification(title: String, body: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val channel = NotificationChannel(
            CHANNEL_ID,
            "ScriptumAI",
            NotificationManager.IMPORTANCE_HIGH,
        )
        manager.createNotificationChannel(channel)

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    companion object {
        private const val CHANNEL_ID = "scriptumai_default"
    }
}
