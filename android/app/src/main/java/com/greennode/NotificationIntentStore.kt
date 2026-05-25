package com.greennode

import android.content.Intent
import android.os.Bundle

object NotificationIntentStore {
  @Volatile private var pendingPayload: Bundle? = null

  fun capture(intent: Intent?): Bundle? {
    val payload = buildPayload(intent) ?: return null
    pendingPayload = Bundle(payload)
    return payload
  }

  fun consume(): Bundle? {
    val payload = pendingPayload
    pendingPayload = null
    return payload
  }

  private fun buildPayload(intent: Intent?): Bundle? {
    val extras = intent?.extras ?: return null
    val type = extras.getString("type") ?: return null
    val postId = extras.getString("postId") ?: return null
    val fruitName = extras.getString("fruitName") ?: return null
    val fridgeName = extras.getString("fridgeName") ?: return null

    if (type != "share_created" && type != "share_requested") {
      return null
    }

    return Bundle().apply {
      putString("type", type)
      putString("postId", postId)
      putString("fruitName", fruitName)
      putString("fridgeName", fridgeName)

      extras.getString("requestId")?.takeIf { it.isNotBlank() }?.let {
        putString("requestId", it)
      }

      val messageId =
          extras.getString("google.message_id") ?: extras.getString("message_id")
      messageId?.takeIf { it.isNotBlank() }?.let {
        putString("messageId", it)
      }
    }
  }
}
