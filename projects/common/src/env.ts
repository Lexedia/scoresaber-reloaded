import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // Databases
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),

    LOG_LEVEL: z.enum([
      'debug',
      'info',
      'warn',
      'error',
    ]).optional(),

    ENABLE_QUEUES: z.boolean(),

    S3_ENDPOINT: z.string(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    S3_REGION: z.string(),

    PROMETHEUS_AUTH_TOKEN: z.string(),

    DISCORD_BOT_TOKEN: z.string().optional(),

    DISCORD_CHANNEL_TRACKED_PLAYER_LOGS: z.string().optional(),
    DISCORD_CHANNEL_PLAYER_SCORE_REFRESH_LOGS: z.string().optional(),
    DISCORD_CHANNEL_RANKED_BATCH_LOGS: z.string().optional(),
    DISCORD_CHANNEL_NUMBER_ONE_FEED: z.string().optional(),
    DISCORD_CHANNEL_TOP_50_SCORES_FEED: z.string().optional(),
    DISCORD_CHANNEL_SCORE_FLOODGATE_FEED: z.string().optional(),
    DISCORD_CHANNEL_MEDAL_SCORES_FEED: z.string().optional(),
    DISCORD_CHANNEL_BACKEND_LOGS: z.string().optional(),
    DISCORD_CHANNEL_BEATSAVER_LOGS: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_APP_ENV: z.enum([
      'development',
      'production',
    ]),
    NEXT_PUBLIC_APPLICATION_NAME: z.enum([
      'backend',
      'website',
    ]),

    NEXT_PUBLIC_WEBSITE_NAME: z.string(),
    NEXT_PUBLIC_WEBSITE_URL: z.string(),
    NEXT_PUBLIC_API_URL: z.string(),
    NEXT_PUBLIC_CDN_URL: z.string(),
    NEXT_PUBLIC_WEBSOCKET_URL: z.string(),

    NEXT_PUBLIC_SCORESABER_URL: z.string().optional(),
    NEXT_PUBLIC_BEATLEADER_URL: z.string().optional(),
    NEXT_PUBLIC_BEATLEADER_REPLAY_URL: z.string().optional(),
    NEXT_PUBLIC_ACCSABER_URL: z.string().optional(),
    NEXT_PUBLIC_BEATSAVER_URL: z.string().optional(),
    NEXT_PUBLIC_TWITCH_URL: z.string().optional(),
    NEXT_PUBLIC_STEAM_URL: z.string().optional(),
    NEXT_PUBLIC_ARCVIEWER_URL: z.string().optional(),
    NEXT_PUBLIC_MAPCHECK_URL: z.string().optional(),
    NEXT_PUBLIC_GITHUB_URL: z.string().optional(),
    NEXT_PUBLIC_GRAFANA_URL: z.string().optional(),
    NEXT_PUBLIC_TWITTER_URL: z.string().optional(),
    NEXT_PUBLIC_DISCORD_URL: z.string().optional(),

    NEXT_PUBLIC_ANALYTICS_WEBSITE_ID: z.string().optional(),
    NEXT_PUBLIC_ANALYTICS_SCRIPT_URL: z.string().optional(),
  },

  /**
   * This is the environment variables that are available on the server.
   */
  runtimeEnv: {
    LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',

    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? 'development',
    NEXT_PUBLIC_APPLICATION_NAME: process.env.NEXT_PUBLIC_APPLICATION_NAME,

    ENABLE_QUEUES: process.env.ENABLE_QUEUES === 'true',

    // PostgreSQL
    DATABASE_URL: process.env.DATABASE_URL,

    // Redis
    REDIS_URL: process.env.REDIS_URL,

    // Discord Bot
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,

    DISCORD_CHANNEL_TRACKED_PLAYER_LOGS: process.env.DISCORD_CHANNEL_TRACKED_PLAYER_LOGS,
    DISCORD_CHANNEL_PLAYER_SCORE_REFRESH_LOGS: process.env.DISCORD_CHANNEL_PLAYER_SCORE_REFRESH_LOGS,
    DISCORD_CHANNEL_RANKED_BATCH_LOGS: process.env.DISCORD_CHANNEL_RANKED_BATCH_LOGS,
    DISCORD_CHANNEL_NUMBER_ONE_FEED: process.env.DISCORD_CHANNEL_NUMBER_ONE_FEED,
    DISCORD_CHANNEL_TOP_50_SCORES_FEED: process.env.DISCORD_CHANNEL_TOP_50_SCORES_FEED,
    DISCORD_CHANNEL_SCORE_FLOODGATE_FEED: process.env.DISCORD_CHANNEL_SCORE_FLOODGATE_FEED,
    DISCORD_CHANNEL_MEDAL_SCORES_FEED: process.env.DISCORD_CHANNEL_MEDAL_SCORES_FEED,
    DISCORD_CHANNEL_BACKEND_LOGS: process.env.DISCORD_CHANNEL_BACKEND_LOGS,
    DISCORD_CHANNEL_BEATSAVER_LOGS: process.env.DISCORD_CHANNEL_BEATSAVER_LOGS,

    // Minio
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_REGION: process.env.S3_REGION ?? 'us-east-1',

    // Prometheus
    PROMETHEUS_AUTH_TOKEN: process.env.PROMETHEUS_AUTH_TOKEN,

    // Misc
    NEXT_PUBLIC_WEBSITE_NAME: process.env.NEXT_PUBLIC_WEBSITE_NAME ?? 'ScoreSaber Reloaded',
    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'https://ssr.lexedia.moe',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'https://ssr-api.lexedia.moe',
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL ?? 'https://s3.lexedia.moe',
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? 'wss://ssr-api.lexedia.moe',

    // Analytics
    NEXT_PUBLIC_ANALYTICS_WEBSITE_ID: process.env.NEXT_PUBLIC_ANALYTICS_WEBSITE_ID,
    NEXT_PUBLIC_ANALYTICS_SCRIPT_URL: process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL,

    // External Services
    NEXT_PUBLIC_SCORESABER_URL: process.env.NEXT_PUBLIC_SCORESABER_URL ?? 'https://scoresaber.com',
    NEXT_PUBLIC_BEATLEADER_URL: process.env.NEXT_PUBLIC_BEATLEADER_URL ?? 'https://beatleader.com',
    NEXT_PUBLIC_BEATLEADER_REPLAY_URL: process.env.NEXT_PUBLIC_BEATLEADER_REPLAY_URL ?? 'https://replay.beatleader.com',
    NEXT_PUBLIC_ACCSABER_URL: process.env.NEXT_PUBLIC_ACCSABER_URL ?? 'https://accsaberreloaded.com',
    NEXT_PUBLIC_BEATSAVER_URL: process.env.NEXT_PUBLIC_BEATSAVER_URL ?? 'https://beatsaver.com',
    NEXT_PUBLIC_TWITCH_URL: process.env.NEXT_PUBLIC_TWITCH_URL ?? 'https://twitch.tv',
    NEXT_PUBLIC_STEAM_URL: process.env.NEXT_PUBLIC_STEAM_URL ?? 'https://steamcommunity.com',
    NEXT_PUBLIC_ARCVIEWER_URL: process.env.NEXT_PUBLIC_ARCVIEWER_URL ?? 'https://allpoland.github.io/ArcViewer',
    NEXT_PUBLIC_MAPCHECK_URL: process.env.NEXT_PUBLIC_MAPCHECK_URL ?? 'https://kivalevan.me/BeatSaber-MapCheck',
    NEXT_PUBLIC_GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/Lexedia/scoresaber-reloaded',
    NEXT_PUBLIC_GRAFANA_URL: process.env.NEXT_PUBLIC_GRAFANA_URL ?? 'http://grafana.lexedia.moe',
    NEXT_PUBLIC_TWITTER_URL: process.env.NEXT_PUBLIC_TWITTER_URL,
    NEXT_PUBLIC_DISCORD_URL: process.env.NEXT_PUBLIC_DISCORD_URL,
  },

  /**
   * This is the prefix for the environment variables that are available on the client.
   */
  clientPrefix: 'NEXT_PUBLIC_',

  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,

  /**
   * Whether to skip validation of the environment variables.
   */
  skipValidation: true,

  /**
   * Whether to check if the environment variables are valid.
   */
  isServer: process.env.NEXT_PUBLIC_APPLICATION_NAME === 'backend',
})
