// External API Endpoint for Hybrid Storage (Google Apps Script)
export const GOOGLE_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';

// Registration Limits
export const MAX_USERS = 2500;
export const REGISTRATION_DISABLED_MSG = "Members limit reached. To add request contact: 9xxxxxxxx";

// Feed Limits & Retention
export const FEED_BATCH_SIZE = 5;
export const MAX_FEED_POSTS = 20; // Hard stop after 4 batches
export const POST_RETENTION_DAYS = 15;

// Storage Safety
export const STORAGE_LIMIT_GB = 4.3;
export const EMERGENCY_CLEANUP_THRESHOLD_DAYS = 3; // Aggressive cleanup if storage is full
