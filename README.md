<div align="center">
  <img width="1200" height="475" alt="MyGmailAgent Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
  <h1>MyGmailAgent</h1>
  <p>Your autonomous AI-powered Gmail copilot — triage, summarize, draft, and manage your inbox with Gemini AI.</p>
  <p>Built by <strong>Sanjay Choudhari</strong></p>
  <a href="https://github.com/Sanjaymo/MyGmailAgent">⭐ Star on GitHub</a>
</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Firebase Setup](#firebase-setup)
- [Google OAuth Setup](#google-oauth-setup)
- [Authentication Approaches](#authentication-approaches)
- [Running Locally](#running-locally)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Author](#author)

---

## Overview

MyGmailAgent is a full-stack AI email client built on top of the Gmail API. It uses **Google Gemini AI** for intelligent inbox triage, email summarization, smart reply drafting, and a conversational copilot.

Authentication supports two approaches:
- **Google Identity Services (GIS)** — works on localhost without any domain whitelisting (current default)
- **Firebase Authentication** — recommended for production deployments with full session management

The Gmail API is called directly from the browser using the OAuth access token.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Express.js (Node.js), TypeScript |
| AI | Google Gemini (`gemini-2.5-flash`) via `@google/genai` |
| Auth (default) | Google Identity Services (GIS) OAuth 2.0 |
| Auth (alternative) | Firebase Authentication + Google OAuth 2.0 |
| Email API | Gmail REST API (direct from browser) |
| Icons | Lucide React |
| Animation | Framer Motion |

---

## Features

- **AI Inbox Triage** — Batch categorize up to 20 emails with urgency scores (1–10)
- **Email Summarization** — TL;DR, key points, action items, sentiment analysis
- **Smart Reply Drafting** — Tone-aware AI reply generation (professional, friendly, concise, etc.)
- **Natural Language Search** — Converts plain English to Gmail query syntax
- **Agent Copilot Chat** — Interactive inbox assistant with action suggestions
- **AI Smart Filters** — Urgent, Receipts, Newsletters, Work views
- **Multi-select Batch Actions** — Archive, trash, mark read/unread in bulk
- **Confirmation Dialogs** — All destructive/send actions require explicit user confirmation
- **Secure Token Handling** — OAuth access token stored in-memory only (never localStorage)

---

## Project Structure

```
MyEmail_Agent/
├── server/
│   └── geminiService.ts       # Gemini AI logic (summarize, triage, draft, chat)
├── src/
│   ├── components/
│   │   ├── AgentCopilotPanel.tsx
│   │   ├── AuthScreen.tsx
│   │   ├── ComposerModal.tsx
│   │   ├── ConfirmationModal.tsx
│   │   ├── EmailDetail.tsx
│   │   ├── EmailList.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   └── firebase.ts        # Google Identity Services (GIS) auth + token management
│   ├── services/
│   │   ├── agentApi.ts        # Client calls to Express AI endpoints
│   │   └── gmailService.ts    # Gmail REST API wrapper
│   ├── App.tsx                # Main app state and layout
│   └── types.ts               # TypeScript interfaces
├── server.ts                  # Express server with AI API routes
├── firebase-applet-config.json
├── .env.local                 # Secret keys (gitignored)
└── vite.config.ts
```

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Google account** with Gmail
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- A **Google Cloud project** with OAuth 2.0 Client ID (Web application type)
- A **Firebase project** (optional — for Firebase Auth approach)

---

## Environment Setup

Create a `.env.local` file in the project root (already gitignored):

```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
GOOGLE_OAUTH_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_OAUTH_CLIENT_SECRET="your_google_oauth_client_secret"
```

> ⚠️ Never commit `.env.local` to version control. It contains sensitive credentials.

### Credentials Reference

| Key | Where to find |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GOOGLE_OAUTH_CLIENT_ID` | [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Same OAuth 2.0 client in Google Cloud Console |
| Firebase config | `firebase-applet-config.json` (already configured) |

---

## Firebase Setup

The Firebase project is: **`stately-jet-sc9s2`**

> ℹ️ Firebase is optional for localhost development. It is recommended for production deployments for full session persistence and user management.

### Step 1 — Enable Google Sign-In Provider

1. Go to [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com/project/stately-jet-sc9s2/authentication/providers)
2. Enable **Google** as a sign-in provider
3. Set your support email and save

### Step 2 — Add Authorized Domains

1. Go to [Firebase Console → Authentication → Settings](https://console.firebase.google.com/project/stately-jet-sc9s2/authentication/settings)
2. Scroll to **Authorized domains** and add:
   ```
   localhost
   ```
3. For production, also add your production domain

### Step 3 — Firebase Config

The `firebase-applet-config.json` is already configured with the project credentials:

```json
{
  "projectId": "stately-jet-sc9s2",
  "appId": "1:829799270108:web:058b0805ee4b23e8b99619",
  "authDomain": "stately-jet-sc9s2.firebaseapp.com",
  "storageBucket": "stately-jet-sc9s2.firebasestorage.app",
  "messagingSenderId": "829799270108"
}
```

---

## Google OAuth Setup

### Step 1 — Configure OAuth 2.0 Client

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your **Web application** OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost
   http://localhost:3000
   ```
4. Under **Authorized redirect URIs**, add (required for Firebase Auth):
   ```
   http://localhost:3000
   https://stately-jet-sc9s2.firebaseapp.com/__/auth/handler
   ```
5. Click **Save** and wait ~2 minutes for changes to propagate

### Step 2 — Enable Gmail API

1. Go to [Google Cloud Console → APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Search for **Gmail API** and click **Enable**

### Step 3 — OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Set app name to **MyGmailAgent**
3. Set publishing status to **In production** (External) so any Google account can sign in
4. Add the following Gmail scopes:
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.compose`

---

## Authentication Approaches

This project supports two authentication methods. You can switch between them depending on your environment.

### Option 1 — Google Identity Services (GIS) ✅ Default / Recommended for localhost

Uses Google's own OAuth 2.0 token client loaded directly from `accounts.google.com/gsi/client`. No Firebase domain whitelisting required.

**How it works:**
1. GIS script is loaded in `index.html`
2. On sign-in, `google.accounts.oauth2.initTokenClient` requests an access token
3. User profile is fetched from `https://www.googleapis.com/oauth2/v3/userinfo`
4. Access token is cached in memory and used for all Gmail API calls

**Pros:**
- ✅ Works on `localhost` without any domain configuration
- ✅ No Firebase dependency for auth
- ✅ Simpler setup

**Cons:**
- ❌ No persistent session (token lost on page refresh — user must sign in again)

---

### Option 2 — Firebase Authentication (Recommended for Production)

Uses Firebase's `signInWithPopup` with `GoogleAuthProvider` for full session persistence.

**How it works:**
1. Firebase is initialized with `firebase-applet-config.json`
2. `signInWithPopup` opens a Google OAuth popup
3. Firebase manages the session and token refresh automatically

**Pros:**
- ✅ Persistent login session across page refreshes
- ✅ Full Firebase Auth user management
- ✅ Token refresh handled automatically

**Cons:**
- ❌ Requires `localhost` to be added to Firebase authorized domains
- ❌ Requires matching OAuth Client ID between Firebase and Google Cloud

**To switch to Firebase Auth**, update `src/lib/firebase.ts` to use:

```ts
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach(scope => provider.addScope(scope));

export const googleSignIn = async () => {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return { user: result.user, accessToken: credential?.accessToken };
};
```

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up .env.local (see Environment Setup above)

# 3. Start the development server
npm run dev
```

Open your browser at **http://localhost:3000**

The dev server runs both the Vite frontend and Express backend together via `tsx server.ts`.

---

## Building for Production

```bash
# Build frontend (Vite) + backend (esbuild)
npm run build

# Start production server
npm start
```

---

## Troubleshooting

### `Error 403: access_denied`
- Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- Make sure publishing status is **In production**
- Make sure all Gmail scopes are added

### `auth/unauthorized-domain` (Firebase Auth only)
- Add `localhost` to Firebase authorized domains
- Go to [Firebase Console → Authentication → Settings](https://console.firebase.google.com/project/stately-jet-sc9s2/authentication/settings)
- Or switch to GIS auth which doesn't require domain whitelisting

### `auth/invalid-credential` (Firebase Auth only)
- The OAuth Client ID must match the one configured in your Firebase project
- Go to [Firebase Console → Authentication → Sign-in method → Google](https://console.firebase.google.com/project/stately-jet-sc9s2/authentication/providers) and verify the Web Client ID matches

### `Gmail API Error (401)`
- Your OAuth access token has expired — sign out and sign back in
- Make sure the Gmail API is enabled in Google Cloud Console

### `Google Identity Services not loaded`
- Hard refresh the page (`Ctrl + Shift + R`)
- Make sure you have internet access (GIS script loads from `accounts.google.com`)

### AI features not working
- Verify `GEMINI_API_KEY` is set correctly in `.env.local`
- Check the terminal running `npm run dev` for Gemini API errors
- The app has built-in fallback responses if the key is missing

### Port already in use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Author

**Sanjay Choudhari**

- GitHub: [@Sanjaymo](https://github.com/Sanjaymo)
- Repository: [https://github.com/Sanjaymo/MyGmailAgent](https://github.com/Sanjaymo/MyGmailAgent)

---

## Getting Started (Clone & Run)

```bash
# Clone the repository
git clone https://github.com/Sanjaymo/MyGmailAgent.git

# Navigate into the project
cd MyGmailAgent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and fill in your GEMINI_API_KEY and OAuth credentials

# Start the dev server
npm run dev
```

Open your browser at **http://localhost:3000**

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Sanjaymo">Sanjay Choudhari</a> using React, Gemini AI, Google Identity Services & Gmail API</p>
</div>
