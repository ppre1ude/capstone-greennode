package com.greennode

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class GreennodeNotificationModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "GreennodeNotification"

  @ReactMethod
  fun consumeInitialNotificationPayload(promise: Promise) {
    val payload = NotificationIntentStore.consume()
    promise.resolve(payload?.let { Arguments.fromBundle(it) })
  }
}
