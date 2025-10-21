import { PostHog } from "posthog-node";
import { app } from "electron";
import * as dotenv from "dotenv";
import * as crypto from "crypto";
import fs from "fs";
import path from "path";

dotenv.config();

// Initialize PostHog client from environment variables
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://app.posthog.com";

let posthog: PostHog | null = null;
let isEnabled = true;
let userId: string | null = null;

/**
 * Get or create a persistent anonymous user ID
 */
const getOrCreateUserId = (): string => {
  const userDataPath = app.getPath("userData");
  const idFile = path.join(userDataPath, ".analytics-id");

  try {
    if (fs.existsSync(idFile)) {
      return fs.readFileSync(idFile, "utf-8").trim();
    }

    // Generate new random UUID
    const newId = crypto.randomUUID();
    fs.writeFileSync(idFile, newId, "utf-8");
    return newId;
  } catch (error) {
    console.error("[Analytics] Failed to get/create user ID:", error);
    return "anonymous";
  }
};

/**
 * Initialize analytics
 */
export const initAnalytics = (): void => {
  try {
    // Only enable if API key is set and not in development
    if (!POSTHOG_API_KEY || process.env.NODE_ENV === "development") {
      console.log("[Analytics] Disabled (no API key or development mode)");
      isEnabled = false;
      return;
    }

    posthog = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1, // Send events immediately (good for desktop apps)
      flushInterval: 0, // Don't batch
    });

    // Generate a persistent anonymous user ID
    userId = getOrCreateUserId();

    console.log("[Analytics] Initialized");

    // Track app launch
    trackEvent("app_launched", {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
    });
  } catch (error) {
    console.error("[Analytics] Initialization failed:", error);
    isEnabled = false;
  }
};

/**
 * Track an event
 * @param eventName - Name of the event
 * @param properties - Additional properties for the event
 */
export const trackEvent = (
  eventName: string,
  properties: Record<string, any> = {}
): void => {
  if (!isEnabled || !posthog || !userId) {
    return;
  }

  try {
    posthog.capture({
      distinctId: userId,
      event: eventName,
      properties: {
        ...properties,
        app_version: app.getVersion(),
        platform: process.platform,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Analytics] Failed to track event:", eventName, error);
  }
};

/**
 * Track feature usage
 * @param feature - Name of the feature used
 * @param metadata - Additional metadata
 */
export const trackFeature = (
  feature: string,
  metadata: Record<string, any> = {}
): void => {
  trackEvent("feature_used", {
    feature,
    ...metadata,
  });
};

/**
 * Shutdown analytics (flush pending events)
 */
export const shutdownAnalytics = async (): Promise<void> => {
  if (!isEnabled || !posthog) {
    return;
  }

  try {
    await posthog.shutdown();
    console.log("[Analytics] Shutdown complete");
  } catch (error) {
    console.error("[Analytics] Shutdown failed:", error);
  }
};
