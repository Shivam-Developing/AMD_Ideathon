# Use official Node.js lightweight image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Install 'serve' globally to serve the static site
RUN npm install -g serve

# Copy the static assets
COPY public ./public

# Expose the port Cloud Run expects
EXPOSE 8080

# Copy and setup the startup script
COPY start.sh ./
RUN chmod +x start.sh

# Start the server using the script
CMD ["./start.sh"]
