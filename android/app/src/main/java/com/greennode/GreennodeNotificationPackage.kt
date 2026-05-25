package com.greennode

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class GreennodeNotificationPackage : ReactPackage {
  @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
  override fun createNativeModules(
      reactContext: ReactApplicationContext,
  ): MutableList<NativeModule> =
      mutableListOf(GreennodeNotificationModule(reactContext))

  override fun createViewManagers(
      reactContext: ReactApplicationContext,
  ): MutableList<ViewManager<*, *>> = mutableListOf()
}
