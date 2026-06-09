import { api } from './axios';

export interface TokenStatus {
  total: number;
  registered: number;
  unregistered: number;
  adminTokenRegistered: boolean;
}

export interface BroadcastResult {
  message: string;
  usersFound: number;
  validTokens: number;
  accepted: number;
  rejected: number;
  errors: { message: string; details: any }[];
  receiptIds: string[];
  hint: string;
}

export interface ReceiptResult {
  total: number;
  delivered: number;
  failed: number;
  errors: { id: string; message: string; errorCode: string }[];
  rawReceipts: Record<string, any>;
}

export const debugApi = {
  getTokenStatus: () => api.get<TokenStatus>('/debug/notify/status'),
  sendSelfTest: () => api.post<{ message: string; ticket: any }>('/debug/notify/self'),
  sendWateringReminder: (treeId: string, testMode: boolean) =>
    api.post<{ message: string; treeName: string; adoptersNotified?: number; ticket?: any }>(
      '/debug/notify/watering-reminder',
      { treeId, testMode }
    ),
  broadcastTest: (message?: string) =>
    api.post<BroadcastResult>('/debug/notify/broadcast', { message }),
  checkReceipts: (receiptIds: string[]) =>
    api.post<ReceiptResult>('/debug/notify/receipts', { receiptIds }),
  triggerCron: () => api.post<{ message: string }>('/debug/trigger-cron'),
};
