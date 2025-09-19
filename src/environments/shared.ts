// src/environments/shared.ts
type Env = {
  mode: string;
  isDev: boolean;
  isProd: boolean;
  apiUrl: string;
  graphqlUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    vapidKey?: string; // for FCM web push
  };
};

function req(name: string, v: string | undefined) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env: Env = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  apiUrl: req('VITE_API_URL', import.meta.env.VITE_API_URL),
  graphqlUrl: req('VITE_GRAPHQL_URL', import.meta.env.VITE_GRAPHQL_URL),
  firebase: {
    apiKey: req('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: req('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: req('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: req('VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: req('VITE_FIREBASE_MESSAGING_SENDER_ID', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: req('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  },
};
