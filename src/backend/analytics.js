const { PostHog } = require("posthog-node");
const { app } = require("electron");
require("dotenv").config();

// Initialize PostHog client from environment variables
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://app.posthog.com";

let posthog = null;
let isEnabled = true;
let userId = null;

/**
 * Initialize analytics
 */
const initAnalytics = () => {
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
 * Get or create a persistent anonymous user ID
 */
const getOrCreateUserId = () => {
  const crypto = require("crypto");
  const fs = require("fs");
  const path = require("path");

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
 * Track an event
 * @param {string} eventName - Name of the event
 * @param {object} properties - Additional properties for the event
 */
const trackEvent = (eventName, properties = {}) => {
  if (!isEnabled || !posthog) {
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
 * @param {string} feature - Name of the feature used
 * @param {object} metadata - Additional metadata
 */
const trackFeature = (feature, metadata = {}) => {
  trackEvent("feature_used", {
    feature,
    ...metadata,
  });
};

/**
 * Shutdown analytics (flush pending events)
 */
const shutdownAnalytics = async () => {
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

module.exports = {
  initAnalytics,
  trackEvent,
  trackFeature,
  shutdownAnalytics,
};
