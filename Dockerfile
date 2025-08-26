# Stage 1: Build the Vite app
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

# Build the app for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the built app from Stage 1 (Vite outputs to /dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: replace default Nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
