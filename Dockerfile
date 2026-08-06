# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Variable publique injectée AU BUILD (import.meta.env.PUBLIC_* est figé
# à la compilation Astro, même en SSR). Sans elle, le traceur Umami n'est
# pas inclus dans le HTML → aucune statistique de trafic collectée.
ARG PUBLIC_UMAMI_WEBSITE_ID=""
ENV PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runtime

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose the port the app runs on
EXPOSE 4327

# Set environment variables
ENV PORT=4327
ENV HOST=0.0.0.0

# Start the application
CMD ["npm", "start"]
