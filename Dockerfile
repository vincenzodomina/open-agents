FROM oven/bun:1.2.14 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/agent/package.json packages/agent/package.json
COPY packages/sandbox/package.json packages/sandbox/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/bun.lock ./bun.lock
COPY --from=deps /app/tsconfig.json ./tsconfig.json
COPY apps ./apps
COPY packages ./packages

ENV NEXT_TELEMETRY_DISABLED=1

ARG VERCEL_ENV
ARG VERCEL_URL
ARG VERCEL_PROJECT_PRODUCTION_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GITHUB_CLIENT_ID
ARG NEXT_PUBLIC_GITHUB_APP_SLUG
ARG NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL

ENV VERCEL_ENV=${VERCEL_ENV}
ENV VERCEL_URL=${VERCEL_URL}
ENV VERCEL_PROJECT_PRODUCTION_URL=${VERCEL_PROJECT_PRODUCTION_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=${NEXT_PUBLIC_GITHUB_CLIENT_ID}
ENV NEXT_PUBLIC_GITHUB_APP_SLUG=${NEXT_PUBLIC_GITHUB_APP_SLUG}
ENV NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL=${NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}

WORKDIR /app/apps/web
RUN bun run build:standalone

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG VERCEL_ENV
ARG VERCEL_URL
ARG VERCEL_PROJECT_PRODUCTION_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GITHUB_CLIENT_ID
ARG NEXT_PUBLIC_GITHUB_APP_SLUG
ARG NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL

ENV VERCEL_ENV=${VERCEL_ENV}
ENV VERCEL_URL=${VERCEL_URL}
ENV VERCEL_PROJECT_PRODUCTION_URL=${VERCEL_PROJECT_PRODUCTION_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=${NEXT_PUBLIC_GITHUB_CLIENT_ID}
ENV NEXT_PUBLIC_GITHUB_APP_SLUG=${NEXT_PUBLIC_GITHUB_APP_SLUG}
ENV NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL=${NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
