# CampusEats (SnackZone)

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

The frontend is a Vite + React prototype located in the `Event listing prototype/` directory.

### 1. Navigate to the Frontend Directory

```bash
cd "Event listing prototype"
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
