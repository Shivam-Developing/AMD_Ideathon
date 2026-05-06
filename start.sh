#!/bin/sh
# Generate config.js from template using Cloud Run environment variables

# Copy the template
cp public/config.template.js public/config.js

# Replace the placeholders with the actual environment variables provided to Cloud Run
sed -i "s/YOUR_GEMINI_API_KEY_HERE/${GEMINI_API_KEY}/g" public/config.js
sed -i "s/YOUR_MAPS_API_KEY_HERE/${MAPS_API_KEY}/g" public/config.js
sed -i "s/YOUR_FIREBASE_API_KEY/${FIREBASE_API_KEY}/g" public/config.js

# Note: We hardcoded the other Firebase config items in the template earlier, 
# but replacing the API key ensures the connection is authorized.

# Start the server
exec serve -s public -l 8080
