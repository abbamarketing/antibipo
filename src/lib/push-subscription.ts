import { supabase } from "@/integrations/supabase/client";

let cachedVapidKey: string | null = null;

// Placeholder VAPID key — replace with your real key when configuring push server
const FALLBACK_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-WO49fJPR0218Sniej3Ai-AYt8dJR4gJK0nI0s8';

async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;

  try {
    const { data, error } = await supabase.functions.invoke('vapid-public-key');
    if (error) throw error;
    cachedVapidKey = data.publicKey || null;
    return cachedVapidKey;
  } catch (err) {
    console.warn('Failed to fetch VAPID key from server, using fallback:', err);
    cachedVapidKey = FALLBACK_VAPID_KEY;
    return cachedVapidKey;
  }
}

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

/**
 * Request notification permission from the browser.
 * Returns the permission state: 'granted' | 'denied' | 'default'.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return 'denied';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

/**
 * Get the current notification permission status.
 */
export function getPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Subscribe to Web Push notifications. Saves subscription to Supabase.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      console.warn('VAPID public key not available');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const appServerKey = urlBase64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint!;
    const p256dh = subJson.keys!.p256dh!;
    const auth = subJson.keys!.auth!;

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, endpoint, p256dh, auth },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('Failed to save push subscription:', error);
      return false;
    }

    console.log('Push subscription saved successfully');
    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
    }
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}

/**
 * Check if currently subscribed to push notifications.
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// ── Local Notifications Fallback ──

const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Schedule a local notification after a delay.
 * Returns a timer ID that can be used to cancel.
 */
export function scheduleLocalNotification(
  title: string,
  body: string,
  delayMs: number,
  options?: {
    tag?: string;
    icon?: string;
    url?: string;
    type?: string;
  }
): string {
  const id = options?.tag || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Cancel existing timer with same tag
  if (scheduledTimers.has(id)) {
    clearTimeout(scheduledTimers.get(id)!);
  }

  const timer = setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: options?.icon || '/pwa-192.png',
        tag: id,
      });
    }
    scheduledTimers.delete(id);
  }, delayMs);

  scheduledTimers.set(id, timer);
  return id;
}

/**
 * Cancel a scheduled local notification.
 */
export function cancelLocalNotification(id: string): void {
  const timer = scheduledTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    scheduledTimers.delete(id);
  }
}

/**
 * Cancel all scheduled local notifications.
 */
export function cancelAllLocalNotifications(): void {
  scheduledTimers.forEach((timer) => clearTimeout(timer));
  scheduledTimers.clear();
}

// ── Notification Preferences (stored in localStorage + Supabase) ──

export interface NotificationPreferences {
  med_reminders: boolean;
  mood_checkin: boolean;
  crisis_alerts: boolean;
}

const PREFS_KEY = 'ab_notification_prefs';

const DEFAULT_PREFS: NotificationPreferences = {
  med_reminders: true,
  mood_checkin: true,
  crisis_alerts: true,
};

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

export function setNotificationPreferences(prefs: Partial<NotificationPreferences>): void {
  const current = getNotificationPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
}

export async function saveNotificationPrefsToSupabase(prefs: NotificationPreferences): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('configuracoes' as any).upsert(
      {
        user_id: user.id,
        chave: 'notification_prefs',
        valor: prefs,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'user_id,chave' }
    );
  } catch (err) {
    console.error('Failed to save notification prefs:', err);
  }
}

export async function loadNotificationPrefsFromSupabase(): Promise<NotificationPreferences> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getNotificationPreferences();

    const { data } = await supabase
      .from('configuracoes' as any)
      .select('valor')
      .eq('user_id', user.id)
      .eq('chave', 'notification_prefs')
      .maybeSingle();

    if (data) {
      const prefs = { ...DEFAULT_PREFS, ...(data as any).valor };
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      return prefs;
    }
  } catch (err) {
    console.error('Failed to load notification prefs:', err);
  }
  return getNotificationPreferences();
}
