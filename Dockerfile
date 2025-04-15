FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
# https://nextjs.org/docs/pages/api-reference/next-config-js/environment-variables
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_STRIPE_SECRET_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG NEXT_PUBLIC_DOMAIN
ARG NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_YEARLY_BASIC_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_LINK
ARG NEXT_PUBLIC_STRIPE_BASIC_YEARLY_LINK
ARG NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_YEARLY_PRO_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK
ARG NEXT_PUBLIC_STRIPE_PRO_YEARLY_LINK
ARG NEXT_PUBLIC_STRIPE_YEARLY_EXPERTISE_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_EXPERTISE_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_EXPERTISE_MONTHLY_LINK
ARG NEXT_PUBLIC_STRIPE_EXPERTISE_YEARLY_LINK
ARG NEXT_PUBLIC_STRIPE_CREDIT_PURCHASE_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_CREDIT_PURCHASE_LINK
ARG NEXT_PUBLIC_REMOVE_BG_API_KEY
ARG NEXT_PUBLIC_IMGGEN_API_KEY
ARG HUGGINGFACE

# Build Next.js app with ESLint disabled
ENV NEXT_TELEMETRY_DISABLED=1
ENV ESLINT_DISABLE=1
RUN npm run build -- --no-lint

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy necessary files for running the application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app will run on
EXPOSE 3000

# Set the environment variables (can be overridden at runtime)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Note: Sensitive environment variables like STRIPE_WEBHOOK_SECRET
# should be passed at runtime via docker-compose.yml or docker run

# Start the application
CMD ["node", "server.js"] 