package com.greennode

import android.content.Intent
import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens manages its own fragment state; restoring Android fragments crashes.
    super.onCreate(null)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "greennode"

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    emitNotificationOpenEvent(intent)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle? =
            buildNotificationLaunchOptions(intent)
      }

  private fun buildNotificationLaunchOptions(intent: Intent?): Bundle? {
    val payload = NotificationIntentStore.capture(intent) ?: return null

    return Bundle().apply {
      putBundle("initialNotificationPayload", payload)
    }
  }

  private fun emitNotificationOpenEvent(intent: Intent?) {
    val payload = NotificationIntentStore.capture(intent) ?: return
    val reactContext = reactActivityDelegate.currentReactContext ?: return

    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("greennodeNotificationOpened", Arguments.fromBundle(payload))
  }
}
