package io.invertase.firebase.messaging

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.HeadlessJsTaskService
import com.google.firebase.messaging.RemoteMessage
import io.invertase.firebase.app.ReactNativeFirebaseApp
import io.invertase.firebase.common.ReactNativeFirebaseEventEmitter
import io.invertase.firebase.common.SharedUtils

class GreennodeFirebaseMessagingReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    Log.d(TAG, "broadcast received for message")
    if (ReactNativeFirebaseApp.getApplicationContext() == null) {
      ReactNativeFirebaseApp.setApplicationContext(context.applicationContext)
    }

    val extras = intent.extras
    if (extras == null) {
      Log.e(TAG, "broadcast intent received with no extras")
      return
    }

    val remoteMessage = RemoteMessage(extras)
    val emitter = ReactNativeFirebaseEventEmitter.getSharedInstance()
    val hasNotificationPayload = remoteMessage.notification != null

    if (hasNotificationPayload) {
      remoteMessage.messageId?.let {
        ReactNativeFirebaseMessagingReceiver.notifications[it] = remoteMessage
      }
      ReactNativeFirebaseMessagingStoreHelper.getInstance()
        .messagingStore
        .storeFirebaseMessage(remoteMessage)
    }

    if (SharedUtils.isAppInForeground(context)) {
      emitter.sendEvent(
        ReactNativeFirebaseMessagingSerializer.remoteMessageToEvent(remoteMessage, false),
      )
      return
    }

    if (hasNotificationPayload) {
      // Avoid booting Headless JS before the Activity handles a notification tap.
      Log.d(TAG, "notification payload stored; skipping headless JS startup")
      return
    }

    try {
      val backgroundIntent =
        Intent(context, ReactNativeFirebaseMessagingHeadlessService::class.java)
      backgroundIntent.putExtra("message", remoteMessage)
      val name: ComponentName? = context.startService(backgroundIntent)
      if (name != null) {
        HeadlessJsTaskService.acquireWakeLockNow(context)
      }
    } catch (exception: IllegalStateException) {
      Log.e(
        TAG,
        "Background messages only work if the message priority is set to 'high'",
        exception,
      )
    }
  }

  private companion object {
    const val TAG = "GreennodeFCMReceiver"
  }
}
