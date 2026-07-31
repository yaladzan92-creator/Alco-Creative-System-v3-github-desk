<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# ALCO Creative System

Local-first AI workflow app for digital marketers who need fast, beginner-friendly ads copy support.

This repository is set up for local development and a Firebase CLI publish path with a separate backend service.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in [.env.local](.env.local) only if you want a server-side default key for local testing
3. Run the app:
   `npm run dev`

## Firebase Publish Path

1. Build the app:
   `npm run build`
2. Deploy hosting with Firebase CLI:
   `firebase deploy --only hosting`
3. Deploy the backend service separately if you use Cloud Run or another container-based flow.

## Cloud Run Backend Path

If you want the AI proxy to run in Cloud, deploy the backend from this repo root as a Cloud Run service named `alco-api`.

1. Build locally or let Cloud Run build from source.
2. Deploy the root service to Cloud Run.
3. Keep Firebase Hosting rewrites pointing `/api/**` to that service.
