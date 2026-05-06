/**
 * NutriSense Configuration — API Keys & Credentials
 * 
 * ⚠️  INSTRUCTIONS:
 * 1. Replace ALL placeholder values below with your actual API keys
 * 2. This file is gitignored — never commit real keys to version control
 * 3. A template (config.template.js) is committed for reference
 * 
 * Required API keys:
 * - Gemini API Key: https://aistudio.google.com/apikey
 * - Firebase Config: Firebase Console → Project Settings → General → Your apps
 * - Google Maps API Key: Google Cloud Console → APIs & Services → Credentials
 *     (Enable: Maps Embed API, Maps JavaScript API, Places API)
 */

/** @constant {string} Gemini API key for AI meal analysis, nudges, and restaurant verdicts */
export const GEMINI_API_KEY = 'AIzaSyBJkTRH0I9kZK9h0Tm7wMO7wlIjMEysVZM';

/** @constant {Object} Firebase project configuration */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAhCj-wf9SagiM7Zo5mKTe97rUZrrRmQic',
  authDomain: 'nutrisense-ff71c.firebaseapp.com',
  projectId: 'nutrisense-ff71c',
  storageBucket: 'nutrisense-ff71c.firebasestorage.app',
  messagingSenderId: '63566069745',
  appId: '1:63566069745:web:db07cfcb7875ecb6f34e50'
};

/** @constant {string} Google Maps API key (Maps Embed + Maps JS + Places) */
export const MAPS_API_KEY = 'AIzaSyBFwkBr7HUaTKo_7jxJI3ep5bxvxo8lyRA';
