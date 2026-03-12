import { supabase } from "@/integrations/supabase/client";

let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;
  
  try {
    const { data, error } = await supabase.functions.invoke('vapid-public-key');
    if (error) throw error;
    cachedVapidKey = data.publicKey || null;
    return cachedVapidKey;
  } catch (err) {
    console.error('Failed to fetch VAPID public key:', err);
    return null;
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
