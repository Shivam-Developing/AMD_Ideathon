# NutriSense — AI Food Companion

> Developed for the AMD Slingshot × H2S Hackathon (Food & Health App Challenge)

NutriSense is a Gemini-powered smart food companion that helps individuals make better food choices through AI meal analysis, personalized nudges, and contextual recommendations.

**One-line pitch:** "NutriSense uses Google Gemini to analyze your meal photo, tracks your eating habits over time, and nudges you toward better choices based on your personal health goal — all powered by Firebase and Google Maps."

## Features

1. **AI Meal Scanner**: Take a photo of your food, and Gemini 2.5 Flash analyzes its macros, calories, health score, and provides actionable improvements.
2. **Habit Dashboard**: Tracks your daily streaks, macro trends over a week, and provides just-in-time AI motivational nudges based on time of day.
3. **Healthy Restaurant Finder**: Uses the Google Places API to find relevant healthy spots near you and uses AI to give a verdict on whether they align with your health goal.

## Tech Stack & Google Services

This app maximizes the use of Google Cloud & Developer services (7 total used):
1. **Gemini 2.5 Flash API**: Multimodal meal analysis, text nudges, restaurant evaluation.
2. **Firebase Auth**: Google Sign-In for seamless onboarding.
3. **Firebase Firestore**: Storing user profiles and meal history.
4. **Firebase Hosting**: For deploying the Single Page Application.
5. **Google Maps Embed API**: Displaying the interactive location map.
6. **Google Places API**: Nearby search for restaurants.
7. **Google Fonts**: Nunito and Inter for modern typography.

## Setup Instructions

1. **Clone the repository**
2. **Install dependencies** (for linting and testing):
   ```bash
   npm install
   ```
3. **Configure API Keys**:
   - Copy `public/config.template.js` to `public/config.js`
   - Paste your Gemini, Firebase, and Maps API keys into `public/config.js`
4. **Run locally**:
   ```bash
   npm run serve
   ```
5. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

## Development & Testing
- Run tests: `npm run test`
- Run linter: `npm run lint`

*Designed with a focus on modern UI, smooth animations, and robust, structured AI outputs.*
