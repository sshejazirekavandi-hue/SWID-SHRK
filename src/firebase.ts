import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with forced long-polling to prevent 10s WebChannel streaming hangs
// behind proxies, VPNs, firewalls, or sandboxed preview iframes.
function initFirestoreDb() {
  const dbId = firebaseConfig.firestoreDatabaseId || undefined;
  const settings = {
    experimentalForceLongPolling: true,
    experimentalLongPollingOptions: { timeoutSeconds: 20 },
    ignoreUndefinedProperties: true,
  };
  try {
    return dbId
      ? initializeFirestore(app, settings, dbId)
      : initializeFirestore(app, settings);
  } catch {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
}

export const db = initFirestoreDb();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isPermissionDeniedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code) : '';
  const msg = err instanceof Error ? err.message : String(err);
  return (
    code === 'permission-denied' ||
    msg.includes('Missing or insufficient permissions')
  );
}

// Configure Google Auth Provider with Gmail Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// In-memory cache for the access token (NEVER in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is recognized by Firebase, but token was reset (e.g. reload)
        // Access token can be retrieved on demand or on next sign-in
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token for Gmail.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Deduplicated Firestore connection validation
let connectionTestPromise: Promise<void> | null = null;

export async function testConnection(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }
  if (connectionTestPromise) {
    return connectionTestPromise;
  }

  connectionTestPromise = (async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Firebase connection: Client is offline or network unreachable.');
      }
    }
  })();

  return connectionTestPromise;
}

// Save correspondence record to user's Firestore subcollection
export async function saveEmailToFirestore(
  userId: string,
  emailData: {
    to: string;
    from: string;
    subject: string;
    body: string;
    snippet?: string;
    type: 'sent' | 'draft' | 'inbox' | 'inquiry';
  }
) {
  const path = `users/${userId}/emails`;
  try {
    const userEmailsCol = collection(db, 'users', userId, 'emails');
    const docRef = await addDoc(userEmailsCol, {
      ...emailData,
      userId,
      createdAt: serverTimestamp(),
      isoDate: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    console.warn('Could not record email to Firestore:', err);
    return null;
  }
}

// Fetch saved email records from Firestore
export async function fetchUserSavedEmails(userId: string) {
  const path = `users/${userId}/emails`;
  try {
    const userEmailsCol = collection(db, 'users', userId, 'emails');
    const q = query(userEmailsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn('Could not read user emails from Firestore:', err);
    return [];
  }
}
