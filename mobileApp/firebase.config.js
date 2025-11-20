// Firebase Configuration for Event Mobile App
// This configuration connects your mobile app to Firebase services

export const firebaseConfig = {
  apiKey: "AIzaSyANIrO6xx7r0_fapXTS_VCEqNR7pYwuabI", // Replace with your actual API key
  authDomain: "event-mobile-app-8805b.firebaseapp.com",
  projectId: "event-mobile-app-8805b",
  storageBucket: "event-mobile-app-8805b.firebasestorage.app",
  messagingSenderId: "323171630213", // Replace with your actual sender ID
  appId: "1:323171630213:web:e88bb7808100f1663afdec", // Replace with your actual app ID
};

// Backend API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://event-mobile-app-production.up.railway.app', // Always use production backend for now
  // BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://event-mobile-app-production.up.railway.app',
  TIMEOUT: 10000,
};

export default firebaseConfig;
