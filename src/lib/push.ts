import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = 'BGVew2-ZxyOVMx2krEo-lwB8LPIXBNa7qTKDs1LK74KrlUbsnZcCPDqDnWtT0MCQze6hIYcedayZNPe8Msr2NiA';

export async function registerPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return false;
    }

    try {
        // 1. Register Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW Registered:', registration);

        // 2. Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Permission denied');
            return false;
        }

        // 3. Subscribe
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // 4. Save to Database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                subscription: subscription.toJSON(),
                user_agent: navigator.userAgent
            }, { onConflict: 'user_id, subscription' });

        if (error) {
            console.error('Failed to save subscription:', error);
            return false;
        }

        console.log('Push Registered Successfully!');
        return true;

    } catch (error) {
        console.error('Error registering push:', error);
        return false;
    }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
