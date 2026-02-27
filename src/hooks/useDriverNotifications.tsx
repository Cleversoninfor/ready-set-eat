import { useEffect, useRef, useCallback, useState } from 'react';

const SEEN_ORDERS_KEY = 'driver_seen_order_ids';

function getSeenOrderIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SEEN_ORDERS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function persistSeenOrderIds(ids: Set<number>) {
  localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify([...ids]));
}

/** Play a short beep sound once */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    // Clean up
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
      ctx.close().catch(() => {});
    }, 600);
  } catch (e) {
    console.warn('[DriverNotif] beep failed', e);
  }
}

async function sendPushNotification(count: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('🚚 Novo Pedido de Entrega', {
        body: count === 1
          ? 'Você recebeu um novo pedido. Toque para visualizar.'
          : `Você recebeu ${count} novos pedidos. Toque para visualizar.`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'driver-new-order',
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200],
      } as NotificationOptions);
    } else {
      new Notification('🚚 Novo Pedido de Entrega', {
        body: 'Você recebeu um novo pedido. Toque para visualizar.',
        icon: '/icon-192.png',
      });
    }
  } catch (e) {
    console.warn('[DriverNotif] push failed', e);
  }
}

export function useDriverNotifications(orders: any[] | undefined) {
  const seenRef = useRef(getSeenOrderIds());
  const initializedRef = useRef(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());
  const [permissionGranted, setPermissionGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      return;
    }
    if (Notification.permission === 'denied') return;
    const result = await Notification.requestPermission();
    setPermissionGranted(result === 'granted');
  }, []);

  // On first user interaction, request permission
  useEffect(() => {
    const handler = () => {
      requestPermission();
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
    };
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      window.addEventListener('click', handler, { once: true });
      window.addEventListener('touchstart', handler, { once: true });
      return () => {
        window.removeEventListener('click', handler);
        window.removeEventListener('touchstart', handler);
      };
    }
  }, [requestPermission]);

  // Detect new orders
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    const currentIds = new Set(orders.map((o: any) => o.id as number));

    // First load: mark all current orders as seen (don't alert on refresh)
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Merge current orders into seen set
      currentIds.forEach((id) => seenRef.current.add(id));
      persistSeenOrderIds(seenRef.current);
      // But mark "ready" orders (not yet started) as visually new
      const readyIds = new Set(
        orders.filter((o: any) => o.status === 'ready').map((o: any) => o.id as number)
      );
      setNewOrderIds(readyIds);
      return;
    }

    // Find truly new orders (not seen before)
    const brandNew: number[] = [];
    currentIds.forEach((id) => {
      if (!seenRef.current.has(id)) {
        brandNew.push(id);
        seenRef.current.add(id);
      }
    });

    if (brandNew.length > 0) {
      persistSeenOrderIds(seenRef.current);

      // Play one beep per new order, staggered
      brandNew.forEach((_, i) => {
        setTimeout(() => playBeep(), i * 600);
      });

      // Send push notification
      sendPushNotification(brandNew.length);

      // Add to visual "new" set
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        brandNew.forEach((id) => next.add(id));
        return next;
      });
    }

    // Clean up seen IDs that are no longer in the order list (completed)
    const toRemove: number[] = [];
    seenRef.current.forEach((id) => {
      if (!currentIds.has(id)) toRemove.push(id);
    });
    if (toRemove.length > 0) {
      toRemove.forEach((id) => seenRef.current.delete(id));
      persistSeenOrderIds(seenRef.current);
    }
  }, [orders]);

  // Mark order as acknowledged (when driver clicks "Iniciar Entrega")
  const acknowledgeOrder = useCallback((orderId: number) => {
    setNewOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }, []);

  return {
    newOrderIds,
    acknowledgeOrder,
    permissionGranted,
    requestPermission,
  };
}
