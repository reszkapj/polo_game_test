// Initialize push notifications
async function initializeNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.log('Push notifications not supported');
    return;
  }

  try {
    // Register service worker
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    // Get FCM token
    const token = await firebase.messaging().getToken({
      vapidKey: 'BG8tbedFo8H5yyaNS4TrgCMLbd6ggrdynd5qDItxNxzH69s4CO4IrNNlXI8-xckmN8XvJFm5_uEkfjCOevJ0nVg' // TODO: Replace with your VAPID key
    });
    
    if (token) {
      console.log('FCM Token:', token);
      // TODO: Save token to user preferences if needed
    }

    // Handle foreground messages
    firebase.messaging().onMessage((payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification even when page is active
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192.png'
        });
      }
    });
    
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

// Auto-initialize when module loads
initializeNotifications();