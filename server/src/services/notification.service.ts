// Notification service — Firebase Cloud Messaging (FCM) sender
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../config/campusgreencareplatform-90fd2-firebase-adminsdk-fbsvc-8e2e2f01a3.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('[Notification] Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('[Notification] Firebase service account JSON not found in config directory. Push notifications will fail.');
    }
  } catch (error) {
    console.error('[Notification] Failed to initialize Firebase Admin:', error);
  }
}

export const notificationService = {
  /**
   * Send a push notification to a single FCM push token.
   */
  async sendPush(fcmToken: string, title: string, body: string, data?: Record<string, any>) {
    if (!fcmToken) {
      console.warn(`[Notification] Missing FCM token`);
      return null;
    }

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: data || {},
    };

    try {
      const messageId = await admin.messaging().send(message);
      console.log(`[Notification] Sent to ${fcmToken.substring(0, 10)}... Message ID: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error(`[Notification] Failed to send:`, error);
      return null;
    }
  },

  /**
   * Send push notifications to multiple tokens using FCM Multicast.
   * FCM supports up to 500 tokens per multicast request.
   */
  async sendBatch(
    messages: Array<{ token: string; title: string; body: string; data?: Record<string, any> }>
  ) {
    if (messages.length === 0) {
      console.log('[Notification] No messages to send, skipping');
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    // Since each message in the batch could theoretically have different data/titles, 
    // and FCM's sendEachForMulticast only takes ONE message body for MULTIPLE tokens, 
    // we actually need to use sendEach() to send completely distinct messages, 
    // OR group them if they are identical.
    // For our broadcast test, the messages are identical except for the token.
    
    // We will use sendEach() which allows an array of distinct messages (up to 500).
    // Let's chunk them into 500 just in case.
    const CHUNK_SIZE = 500;
    let successCount = 0;
    let failureCount = 0;
    const allResponses: admin.messaging.SendResponse[] = [];

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      const chunk = messages.slice(i, i + CHUNK_SIZE).map(m => ({
        token: m.token,
        notification: { title: m.title, body: m.body },
        data: m.data || {}
      }));
      
      try {
        const batchResponse = await admin.messaging().sendEach(chunk);
        successCount += batchResponse.successCount;
        failureCount += batchResponse.failureCount;
        allResponses.push(...batchResponse.responses);
      } catch (error) {
        console.error('[Notification] Batch chunk failed:', error);
      }
    }

    console.log(`[Notification] Batch sent: ${successCount} successful, ${failureCount} failed.`);
    return { successCount, failureCount, responses: allResponses };
  },

  /**
   * Send watering reminder for a specific tree to all its adopters.
   */
  async sendWateringReminder(
    treeName: string,
    treeId: string,
    tokens: string[]
  ) {
    if (tokens.length === 0) return { successCount: 0, failureCount: 0, responses: [] };

    // We can use sendEachForMulticast here since it's the exact same message for all tokens
    const message = {
      tokens,
      notification: {
        title: '💧 Sulama Zamanı!',
        body: `${treeName} ağacının sulanma zamanı geldi. Kampüse gel ve ağacını sula! 🌳`,
      },
      data: { treeId, type: 'watering_reminder' },
    };

    try {
      const batchResponse = await admin.messaging().sendEachForMulticast(message);
      console.log(`[Notification] Watering reminder sent: ${batchResponse.successCount} successful.`);
      return batchResponse;
    } catch (error) {
      console.error('[Notification] Failed to send watering reminder multicast:', error);
      return { successCount: 0, failureCount: tokens.length, responses: [] };
    }
  },
};
