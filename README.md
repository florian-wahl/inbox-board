# Inbox Board

Inbox Board is a privacy-first dashboard for managing your email subscriptions and tracking online orders. It connects to your Gmail account (read-only) and automatically detects subscriptions, recent orders, and high-noise senders—helping you unsubscribe and stay organized. All data is stored and processed locally on your device; nothing ever leaves your computer.

## Features

- **Automatic Subscription Detection:** Finds and lists your active email subscriptions.
- **Order Tracking:** Extracts and displays recent online orders and purchases from your inbox.
- **Unsubscribe Suggestions:** Identifies high-noise senders and provides one-click unsubscribe options (when available).
- **Privacy-First:** All email data is processed and stored locally in your browser using IndexedDB. No data is sent to any server.
- **Configurable Sync:** Choose how many days of email to scan and batch size for syncing.
- **Dark/Light/System Theme:** Customizable appearance.
- **Database Management:** Easily purge all data or just email data from your device.

## Project Structure

```
src/
  components/         # UI components (AppShell, OrderList, SubscriptionList, etc.)
  contexts/           # React context providers (Auth, InboxData, UI)
  db/                 # Local database schema and utilities (IndexedDB via Dexie)
  hooks/              # Custom React hooks (auth, inbox sync, etc.)
  pages/              # Main app pages (Dashboard, Settings, Onboarding)
  services/           # Gmail API and email parsing logic
  types/              # TypeScript types for Gmail, orders, subscriptions
  utils/              # Utility functions (date, storage, regex, etc.)
  App.tsx             # App entry point
  router.tsx          # App routing
  index.tsx           # App bootstrap
```

## Privacy & Data Handling

- **Google Login:** Uses Google OAuth to request read-only access to your Gmail. No email is sent or modified.
- **Local-Only Storage:** All emails, parsed subscriptions, orders, and preferences are stored in your browser (IndexedDB). No cloud or server storage.
- **Open Source:** You can audit the code to verify privacy claims.
- **Easy Data Deletion:** Use the Settings page to purge all data or just email data at any time.

## Tech Stack

- **React** (TypeScript)
- **Material UI** for design
- **Dexie.js** for IndexedDB
- **Google Gmail API** (read-only)
- **Vite** for development and build
- **GitHub Pages** for deployment

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up Google OAuth credentials:**
   - Create a Google Cloud project and OAuth 2.0 Client ID for a web app.
   - Set the `VITE_GOOGLE_CLIENT_ID` environment variable in a `.env` file **(for local development)**.
   - For GitHub Pages deployment, add `VITE_GOOGLE_CLIENT_ID` as a repository secret in GitHub (see Deployment section).
3. **Run the app locally:**
   ```bash
   npm run dev
   ```
   The app will open at [http://localhost:5173](http://localhost:5173) by default.

## Deployment

This project uses **Vite** for building and **GitHub Pages** for deployment.

### Deploying to GitHub Pages

1. Ensure your repository has the `gh-pages` branch enabled (GitHub will serve from this branch).
2. Add your `VITE_GOOGLE_CLIENT_ID` as a **GitHub Secret** in your repository settings (Settings → Secrets and variables → Actions → New repository secret).
3. The deployment workflow will use this secret to inject the environment variable during the build.
4. To deploy, run:
   ```bash
   npm run build
   npm run deploy
   ```
   Or, if using a GitHub Actions workflow, push to `main` and the workflow will handle build and deploy automatically.

### Environment Variables & Secrets

- **Local Development:** Use a `.env` file in the project root:
  ```env
  VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
  ```
- **GitHub Pages Deployment:** Add the same variable as a GitHub Secret. The deployment workflow will read this secret and inject it at build time.

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, features, or suggestions.

---

**Inbox Board** is open source and privacy-focused. Your data stays with you.
