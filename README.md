# CampusEats (SnackZone)
CampusEats helps students discover nearby campus events that are offering free food, all visualized on an interactive map. Users can open the app, see pins dropped across campus for active or upcoming events, and tap into details like what food is being served, where the event is, and when it starts. Instead of relying on word-of-mouth or buried Facebook posts, CampusEats surfaces this information in real time so students can actually show up.

Video Demo (click on the image):

[![Watch the video](https://img.youtube.com/vi/zBExytfmT8k/hqdefault.jpg)](https://www.youtube.com/embed/zBExytfmT8k)

This repository contains both the backend server and the frontend prototype for CampusEats (also referenced as SnackZone).

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Firebase Service Account key (for backend database access)

---

## Backend Setup

The backend is an Express server located in the project root. It connects to Firebase and provides the Core APIs, as well as several scraper/seeder scripts.

### 1. Install Dependencies

In the root directory of the project, run:

```bash
npm install
```

### 2. Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and configure the required variables. 
3. Note especially `GOOGLE_APPLICATION_CREDENTIALS`: You'll need to generate a new private key from your Firebase Console and map the path correctly (e.g., place it at `./config/firebase-service-account.json`).

### 3. Start the Server

Start the application backend:

```bash
npm start
```
*(This will run `node server/index.js`)*

#### Additional Backend Scripts
- `npm run seed:events`: Seeds the database with sample events.
- `npm run scrape:instagram`: Runs the Puppeteer Instagram scraper.
- `npm run follow:instagram`: Runs the Instagram follower tool.

---

## Frontend Setup

The frontend is a Vite + React prototype located in the `frontend/` directory.

### 1. Navigate to the Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

This will run Vite and start the frontend application locally. The terminal output will provide the exact localhost URL (typically `http://localhost:5173`) where you can view it in your browser.

---

## Deploy to Vercel

This project is configured for one-click deployment to [Vercel](https://vercel.com). The backend runs as serverless functions under `/api/*` and the frontend is built as a static Vite app.

### 1. Push to GitHub

Make sure your code is pushed to a GitHub repo (branch `deploy/vercel` or `main`).

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. Vercel will auto-detect the `vercel.json` configuration.

### 3. Set Environment Variables

In the Vercel project dashboard → **Settings → Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON contents of your Firebase service account key |
| `PROJECT_ID` | Your GCP project ID |
| `LOCATION` | Your Vertex AI region (e.g. `us-central1`) |
| `VITE_MAPBOX_TOKEN` | Your Mapbox access token |

### 4. Deploy

Click **Deploy** — Vercel will build the frontend and set up the serverless API automatically.
