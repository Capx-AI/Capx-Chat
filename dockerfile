# Stage 1: Build
FROM node:20 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies (both production and development)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Run the build process (assuming you're using a build script in package.json)
RUN npm run build

# Stage 2: Production
FROM node:20-slim AS production

# Set the working directory
WORKDIR /usr/src/app

# Copy only the necessary files from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/lib ./lib
COPY --from=build /usr/src/app/package*.json ./

# Copy environment variables
COPY .env .

# Install Redis
RUN apt-get update && apt-get install -y redis && rm -rf /var/lib/apt/lists/*

# Expose the application port
EXPOSE 3000

# Define the command to run Redis and the application
CMD ["sh", "-c", "redis-server --daemonize yes && node lib/app.js"]
