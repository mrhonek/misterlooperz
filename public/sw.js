// Service Worker for MisterLooperz app
// Handles background playback timing in Chrome
console.log('Service Worker loaded');

// Cache name for offline support
const CACHE_NAME = 'misterlooperz-cache-v1';

// List of resources to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

// Track video playback timers
let timers = {};

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  
  // Skip waiting to become active immediately
  self.skipWaiting();
  
  // Cache resources for offline use
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker caching resources');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  // Claim clients to control all open windows/tabs
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Message event - handle communication from the page
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.type === 'START_TIMER') {
    // Start a new timer for video playback
    const { videoId, duration, timerId } = event.data;
    
    // Clear any existing timer for this video
    if (timers[timerId]) {
      clearTimeout(timers[timerId].timeoutId);
      delete timers[timerId];
    }
    
    // Set the timer
    const timeoutId = setTimeout(() => {
      console.log('Service Worker timer completed for video', videoId);
      
      // Notify all clients that the timer completed
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'TIMER_COMPLETE',
            videoId,
            timerId
          });
        });
      });
      
      // Remove the timer
      delete timers[timerId];
    }, duration);
    
    // Store the timer information
    timers[timerId] = {
      videoId,
      duration,
      startTime: Date.now(),
      timeoutId
    };
    
    // Respond to the client
    if (event.source) {
      event.source.postMessage({
        type: 'TIMER_STARTED',
        timerId,
        videoId
      });
    }
  }
  else if (event.data.type === 'STOP_TIMER') {
    // Stop an existing timer
    const { timerId } = event.data;
    
    if (timers[timerId]) {
      clearTimeout(timers[timerId].timeoutId);
      delete timers[timerId];
      
      // Respond to the client
      if (event.source) {
        event.source.postMessage({
          type: 'TIMER_STOPPED',
          timerId
        });
      }
    }
  }
  else if (event.data.type === 'CHECK_TIMERS') {
    // Check all timers and report any that have completed
    const now = Date.now();
    const completedTimers = [];
    
    Object.keys(timers).forEach((timerId) => {
      const timer = timers[timerId];
      const elapsed = now - timer.startTime;
      
      if (elapsed >= timer.duration) {
        completedTimers.push({
          timerId,
          videoId: timer.videoId
        });
        
        // Clean up the timer
        clearTimeout(timer.timeoutId);
        delete timers[timerId];
      }
    });
    
    // Respond to the client with completed timers
    if (event.source && completedTimers.length > 0) {
      event.source.postMessage({
        type: 'TIMERS_COMPLETED',
        timers: completedTimers
      });
    }
  }
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
}); 