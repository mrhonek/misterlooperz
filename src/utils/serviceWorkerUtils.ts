// Utility functions for working with the service worker

// Track service worker registration
let registration: ServiceWorkerRegistration | null = null;
let swSupported = false;

// Generate a unique timer ID
const generateTimerId = () => `timer_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

// Track active timers
const activeTimers: { [key: string]: string } = {};

// Register the service worker
export const registerServiceWorker = async (): Promise<boolean> => {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    swSupported = true;
    
    try {
      // Register the service worker
      registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered', registration);
      
      // Set up message listener
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from Service Worker:', event.data);
        
        // Handle timer completion
        if (event.data.type === 'TIMER_COMPLETE' || 
            (event.data.type === 'TIMERS_COMPLETED' && event.data.timers?.length > 0)) {
          
          // Dispatch a custom event that our App component can listen for
          window.dispatchEvent(new CustomEvent('sw-timer-complete', {
            detail: event.data
          }));
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to register Service Worker:', error);
      return false;
    }
  }
  
  console.log('Service Workers not supported in this browser');
  return false;
};

// Start a timer with the service worker
export const startVideoTimer = (videoId: string, duration: number): string | null => {
  if (!swSupported) return null;
  
  // Generate a unique timer ID
  const timerId = generateTimerId();
  
  // Store the video ID associated with this timer
  activeTimers[timerId] = videoId;
  
  // Send the message to the service worker
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'START_TIMER',
      videoId,
      duration,
      timerId
    });
    
    console.log('Started timer for video', videoId, 'with duration', duration, 'ms');
    return timerId;
  }
  
  console.warn('No active Service Worker found');
  return null;
};

// Stop a timer
export const stopTimer = (timerId: string): boolean => {
  if (!swSupported || !timerId) return false;
  
  // Remove from active timers
  delete activeTimers[timerId];
  
  // Send the message to the service worker
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STOP_TIMER',
      timerId
    });
    
    console.log('Stopped timer', timerId);
    return true;
  }
  
  console.warn('No active Service Worker found');
  return false;
};

// Check for completed timers
export const checkTimers = (): void => {
  if (!swSupported) return;
  
  // Send the message to the service worker
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CHECK_TIMERS'
    });
  }
};

// Get the video ID associated with a timer
export const getVideoIdForTimer = (timerId: string): string | null => {
  return activeTimers[timerId] || null;
}; 