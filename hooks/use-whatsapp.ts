// hooks/use-whatsapp.ts - Custom hook untuk WhatsApp notifications
import { useState } from 'react';
import { toast } from 'sonner';

interface WhatsAppHookReturn {
  sendNotification: (target: string, message: string) => Promise<boolean>;
  sendTransactionNotification: (target: string, data: any) => Promise<boolean>;
  sendDailyReport: (target: string, data: any) => Promise<boolean>;
  checkDeviceStatus: () => Promise<{ connected: boolean; device?: string }>;
  sending: boolean;
}

export function useWhatsApp(): WhatsAppHookReturn {
  const [sending, setSending] = useState(false);

  const sendNotification = async (target: string, message: string): Promise<boolean> => {
    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          message
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Notifikasi WhatsApp berhasil dikirim');
        return true;
      } else {
        toast.error(`Gagal mengirim WhatsApp: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error('Gagal mengirim notifikasi WhatsApp');
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendTransactionNotification = async (target: string, data: any): Promise<boolean> => {
    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          type: 'transaction',
          data
        }),
      });

      const result = await response.json();

      if (result.success) {
        return true;
      } else {
        // Hilangkan console.error untuk mengurangi noise
        return false;
      }
    } catch (error) {
      // Hilangkan console.error untuk mengurangi noise
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendDailyReport = async (target: string, data: any): Promise<boolean> => {
    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          type: 'daily-report',
          data
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Laporan harian berhasil dikirim via WhatsApp');
        return true;
      } else {
        toast.error(`Gagal mengirim laporan: ${result.message}`);
        return false;
      }
    } catch (error) {
      toast.error('Gagal mengirim laporan harian');
      return false;
    } finally {
      setSending(false);
    }
  };

  const checkDeviceStatus = async (): Promise<{ connected: boolean; device?: string }> => {
    try {
      const response = await fetch('/api/whatsapp/device', {
        method: 'GET',
      });

      const result = await response.json();

      if (result.success) {
        return {
          connected: result.connected,
          device: result.device
        };
      } else {
        return { connected: false };
      }
    } catch (error) {
      // Hilangkan console.error untuk mengurangi noise
      return { connected: false };
    }
  };

  return {
    sendNotification,
    sendTransactionNotification,
    sendDailyReport,
    checkDeviceStatus,
    sending
  };
}
