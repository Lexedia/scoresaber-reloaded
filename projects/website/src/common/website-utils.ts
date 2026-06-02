import { env } from "@ssr/common/env";

/**
 * Gets if we're in production
 */
export function isProduction() {
  return env.NEXT_PUBLIC_APP_ENV === "production";
}

/**
 * Gets the build information
 *
 * @returns the build information
 */
export function getBuildInformation() {
  const envBuildId = process.env.NEXT_PUBLIC_BUILD_ID;
  const buildId = envBuildId && envBuildId !== "dev"
    ? envBuildId.slice(0, 7)
    : "dev";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
  const buildTimeShort = process.env.NEXT_PUBLIC_BUILD_TIME_SHORT;

  return { buildId, buildTime, buildTimeShort };
}
