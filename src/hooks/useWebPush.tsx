import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush(userType: 'admin' | 'driver', userIdentifier?: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error('Permissão de notificação negada. Ative nas configurações do navegador.');
        return false;
      }

      // Ensure service worker is registered and active
      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }
      // Wait until the SW is active
      if (!registration.active) {
        await new Promise<void>((resolve) => {
          const sw = registration!.installing || registration!.waiting;
          if (!sw) { resolve(); return; }
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') resolve();
          });
        });
      }

      // Get VAPID public key from edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/get-vapid-key`, {
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao obter chave VAPID');
      }

      const { publicKey } = await response.json();
      if (!publicKey) throw new Error('Chave VAPID não disponível');

      // Subscribe to push via PushManager
      const registration = await navigator.serviceWorker.ready;
      const pm = (registration as any).pushManager;

      // Unsubscribe existing if any (to refresh)
      const existingSub = await pm.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      const subscription = await pm.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await (supabase as any).from('push_subscriptions').upsert(
        {
          endpoint: subJson.endpoint,
          p256dh: subJson.keys!.p256dh,
          auth: subJson.keys!.auth,
          user_type: userType,
          user_identifier: userIdentifier || null,
        },
        { onConflict: 'endpoint' }
      );

      if (error) {
        console.error('Failed to save push subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      toast.success('Notificações push ativadas! Você será notificado mesmo com a tela bloqueada.');
      return true;
    } catch (error: any) {
      console.error('Push subscription error:', error);
      toast.error(`Erro ao ativar notificações: ${error.message || 'tente novamente'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, userType, userIdentifier]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await (supabase as any).from('push_subscriptions').delete().eq('endpoint', endpoint);
      }
      setIsSubscribed(false);
      toast.success('Notificações push desativadas');
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
