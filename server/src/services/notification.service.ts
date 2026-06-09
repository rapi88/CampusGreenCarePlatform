// Notification service — Expo Push Notification sender
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceiptId } from 'expo-server-sdk';
import { config } from '../config/env';

const expo = new Expo({
  accessToken: config.expo.accessToken || undefined,
});

export const notificationService = {
  /**
   * Send a push notification to a single Expo push token.
   */
  async sendPush(expoPushToken: string, title: string, body: string, data?: Record<string, any>) {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.warn(`[Notification] Invalid Expo push token: ${expoPushToken}`);
      return null;
    }

    const message: ExpoPushMessage = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    try {
      const [ticket] = await expo.sendPushNotificationsAsync([message]);
      console.log(`[Notification] Sent to ${expoPushToken}:`, ticket);
      return ticket;
    } catch (error) {
      console.error(`[Notification] Failed to send:`, error);
      return null;
    }
  },

  /**
   * Send push notifications to multiple tokens in batches.
   * Expo requires chunking for large batches.
   */
  async sendBatch(
    messages: Array<{ token: string; title: string; body: string; data?: Record<string, any> }>
  ): Promise<ExpoPushTicket[]> {
    const pushMessages: ExpoPushMessage[] = messages
      .filter((m) => Expo.isExpoPushToken(m.token))
      .map((m) => ({
        to: m.token,
        sound: 'default' as const,
        title: m.title,
        body: m.body,
        data: m.data || {},
      }));

    if (pushMessages.length === 0) {
      console.log('[Notification] No valid tokens in batch, skipping');
      return [];
    }

    const chunks = expo.chunkPushNotifications(pushMessages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
      } catch (error) {
        console.error('[Notification] Batch chunk failed:', error);
      }
    }

    console.log(`[Notification] Batch sent: ${tickets.length}/${messages.length} delivered`);
    return tickets;
  },

  /**
   * Check push receipts for a list of ticket IDs (call ~30s after sending).
   * Returns the full receipt map so the caller can surface errors to the client.
   */
  async checkReceipts(ticketIds: ExpoPushReceiptId[]) {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const receipts: Record<string, any> = {};

    for (const chunk of receiptIdChunks) {
      try {
        const chunkReceipts = await expo.getPushNotificationReceiptsAsync(chunk);
        Object.assign(receipts, chunkReceipts);
      } catch (error) {
        console.error('[Notification] Receipt check failed:', error);
      }
    }
    return receipts;
  },

  /**
   * Send watering reminder for a specific tree to all its adopters.
   */
  async sendWateringReminder(
    treeName: string,
    treeId: string,
    tokens: string[]
  ): Promise<ExpoPushTicket[]> {
    const messages = tokens.map((token) => ({
      token,
      title: '💧 Sulama Zamanı!',
      body: `${treeName} ağacının sulanma zamanı geldi. Kampüse gel ve ağacını sula! 🌳`,
      data: { treeId, type: 'watering_reminder' },
    }));

    return this.sendBatch(messages);
  },
};
