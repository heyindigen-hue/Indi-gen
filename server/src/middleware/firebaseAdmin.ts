import fs from 'fs';
import { logger } from '../logger';

type AdminApp = any;
type DecodedFirebaseToken = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  name?: string;
  picture?: string;
  firebase?: { sign_in_provider?: string };
  [key: string]: any;
};

let adminApp: AdminApp | null = null;
let initAttempted = false;
let initError: string | null = null;

function resolveServiceAccountPath(): string | null {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
  return '/etc/secrets/firebase-admin.json';
}

function loadServiceAccount(path: string): any | null {
  try {
    if (!fs.existsSync(path)) return null;
    const raw = fs.readFileSync(path, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    initError = `Failed to read Firebase service account at ${path}: ${(err as Error).message}`;
    logger.warn({ err }, initError);
    return null;
  }
}

function initFirebaseAdmin(): AdminApp | null {
  if (initAttempted) return adminApp;
  initAttempted = true;

  const path = resolveServiceAccountPath();
  if (!path) {
    initError = 'No FIREBASE_SERVICE_ACCOUNT_PATH set and no default file present';
    logger.warn(initError);
    return null;
  }
  const serviceAccount = loadServiceAccount(path);
  if (!serviceAccount) {
    initError =
      `Firebase service account not found at ${path}. ` +
      `Set FIREBASE_SERVICE_ACCOUNT_PATH or upload to /etc/secrets/firebase-admin.json. ` +
      `firebase-verify endpoint will be disabled.`;
    logger.warn(initError);
    return null;
  }

  try {
    // Lazy require so the server starts even if firebase-admin is not installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin');
    if (admin.apps && admin.apps.length > 0) {
      adminApp = admin.apps[0];
    } else {
      adminApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    logger.info({ projectId: serviceAccount.project_id }, 'Firebase Admin SDK initialized');
    return adminApp;
  } catch (err) {
    initError = `firebase-admin failed to initialize: ${(err as Error).message}`;
    logger.warn({ err }, initError);
    adminApp = null;
    return null;
  }
}

export function isFirebaseAdminReady(): boolean {
  initFirebaseAdmin();
  return adminApp !== null;
}

export function firebaseAdminInitError(): string | null {
  initFirebaseAdmin();
  return initError;
}

export async function verifyIdToken(idToken: string): Promise<DecodedFirebaseToken> {
  const app = initFirebaseAdmin();
  if (!app) {
    throw new Error(initError || 'Firebase Admin SDK not initialized');
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin');
  const decoded = await admin.auth(app).verifyIdToken(idToken, true);
  return decoded as DecodedFirebaseToken;
}
