import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
].join(' ');

const CLIENT_ID = '615424997153-8g8r71652rp33plej3hgbkqrs2o7osa2.apps.googleusercontent.com';

let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Minimal user object from Google userinfo
interface GoogleUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

let googleUser: GoogleUser | null = null;

export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  // If we already have token + user in memory (e.g. after sign in)
  if (cachedAccessToken && googleUser) {
    if (onAuthSuccess) onAuthSuccess(googleUser, cachedAccessToken);
  } else {
    if (onAuthFailure) onAuthFailure();
  }
  // Return a no-op unsubscribe
  return () => {};
};

export const googleSignIn = (): Promise<{ user: any; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    if (!(window as any).google) {
      reject(new Error('Google Identity Services not loaded. Please refresh the page.'));
      return;
    }

    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: GMAIL_SCOPES,
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }

        try {
          cachedAccessToken = tokenResponse.access_token;

          // Fetch user profile from Google
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const profile = await profileRes.json();

          googleUser = {
            uid: profile.sub,
            email: profile.email,
            displayName: profile.name,
            photoURL: profile.picture,
          };

          resolve({ user: googleUser, accessToken: tokenResponse.access_token });
        } catch (err) {
          cachedAccessToken = null;
          reject(err);
        }
      },
    });

    client.requestAccessToken({ prompt: 'consent' });
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  cachedAccessToken = null;
  googleUser = null;
  // Revoke Google token if possible
  if ((window as any).google && cachedAccessToken) {
    (window as any).google.accounts.oauth2.revoke(cachedAccessToken);
  }
};
